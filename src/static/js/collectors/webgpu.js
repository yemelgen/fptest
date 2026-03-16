async function collectWebGPU() {
    if (!("gpu" in navigator)) {
        return { webgpu: { supported: false } };
    }

    try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return { webgpu: { supported: false } };

        const device = await adapter.requestDevice();

        // Basic adapter info (some browsers expose more than others)
        const adapterInfo = adapter.requestAdapterInfo
            ? await adapter.requestAdapterInfo().catch(() => ({}))
            : {};

        // Collect features
        const adapterFeatures = Array.from(adapter.features || []);
        const deviceFeatures = Array.from(device.features || []);

        // Collect limits
        const adapterLimits = {};
        for (const [k, v] of Object.entries(adapter.limits)) {
            adapterLimits[k] = v;
        }
        const deviceLimits = {};
        for (const [k, v] of Object.entries(device.limits)) {
            deviceLimits[k] = v;
        }

        // Preferred canvas format
        const preferredCanvasFormat = navigator.gpu.getPreferredCanvasFormat
            ? navigator.gpu.getPreferredCanvasFormat()
            : null;

        // Test buffer capabilities
        const bufferCapabilities = testBufferCapabilities(device);

        // Shader capabilities
        const shaderCapabilities = await testShaderCapabilities(device);

        // Compute capabilities
        const computeCapabilities = testComputeCapabilities(device);

        return {
            webgpu: {
                supported: true,
                adapterInfo,
                adapterFeatures,
                adapterLimits,
                deviceFeatures,
                deviceLimits,
                preferredCanvasFormat,
                bufferCapabilities,
                shaderCapabilities,
                computeCapabilities,
            }
        };

    } catch (e) {
        return { webgpu: { supported: false, error: e.message } };
    }
}

function testBufferCapabilities(device) {
    const capabilities = {};

    try {
        // Test different buffer usages
        const usageTests = [
            { usage: GPUBufferUsage.COPY_SRC, name: 'COPY_SRC' },
            { usage: GPUBufferUsage.COPY_DST, name: 'COPY_DST' },
            { usage: GPUBufferUsage.INDEX, name: 'INDEX' },
            { usage: GPUBufferUsage.VERTEX, name: 'VERTEX' },
            { usage: GPUBufferUsage.UNIFORM, name: 'UNIFORM' },
            { usage: GPUBufferUsage.STORAGE, name: 'STORAGE' },
            { usage: GPUBufferUsage.INDIRECT, name: 'INDIRECT' },
            { usage: GPUBufferUsage.QUERY_RESOLVE, name: 'QUERY_RESOLVE' },
            { usage: GPUBufferUsage.MAP_READ, name: 'MAP_READ' },
            { usage: GPUBufferUsage.MAP_WRITE, name: 'MAP_WRITE' }
        ];

        capabilities.usageSupport = {};
        usageTests.forEach(test => {
            try {
                const buffer = device.createBuffer({
                    size: 1024,
                    usage: test.usage
                });
                capabilities.usageSupport[test.name] = true;
                buffer.destroy();
            } catch (e) {
                capabilities.usageSupport[test.name] = false;
            }
        });

        // Test buffer mapping
        capabilities.mappingSupport = testBufferMappingSupport(device);

    } catch (e) {
        capabilities.error = e.toString();
    }

    return capabilities;
}

async function testBufferMappingSupport(device) {
    try {
        const buffer = device.createBuffer({
            size: 1024,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });

        await buffer.mapAsync(GPUMapMode.READ);
        buffer.unmap();
        buffer.destroy();

        return { supported: true };
    } catch (e) {
        return { supported: false, error: e.toString() };
    }
}

async function testShaderCapabilities(device) {
    const capabilities = {
        wgsl: true, // WebGPU always supports WGSL
        basicShader: false,
        complexShader: false
    };

    try {
        // Test basic vertex shader
        const basicShaderCode = `
            @vertex fn main() -> @builtin(position) vec4f {
                return vec4f(0.0, 0.0, 0.0, 1.0);
            }
        `;

        const basicShader = device.createShaderModule({ code: basicShaderCode });
        capabilities.basicShader = true;

        // Test more complex shader with features
        const complexShaderCode = `
            struct Uniforms {
                transform: mat4x4f,
            };

            @binding(0) @group(0) var<uniform> uniforms: Uniforms;

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            };

            @vertex fn vs(
                @location(0) position: vec4f,
                @location(1) color: vec4f
            ) -> VertexOutput {
                var output: VertexOutput;
                output.position = uniforms.transform * position;
                output.color = color;
                return output;
            }

            @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
                return input.color;
            }
        `;

        const complexShader = device.createShaderModule({ code: complexShaderCode });
        capabilities.complexShader = true;

    } catch (e) {
        capabilities.error = e.toString();
    }

    return capabilities;
}

function testComputeCapabilities(device) {
    const capabilities = {
        basicCompute: false,
        storageBuffers: false,
        workgroupFeatures: false
    };

    try {
        // Test basic compute pipeline
        const computeShader = device.createShaderModule({
            code: `
                @compute @workgroup_size(1)
                fn main() {
                }
            `
        });

        device.createComputePipeline({
            layout: 'auto',
            compute: { module: computeShader, entryPoint: 'main' }
        });
        capabilities.basicCompute = true;

        // Test storage buffer support
        const storageBuffer = device.createBuffer({
            size: 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        capabilities.storageBuffers = true;
        storageBuffer.destroy();

        // Test workgroup features
        const workgroupShader = device.createShaderModule({
            code: `
                var<workgroup> sharedData: array<f32, 64>;

                @compute @workgroup_size(64)
                fn main(@builtin(local_invocation_id) local_id: vec3u) {
                    sharedData[local_id.x] = f32(local_id.x);
                }
            `
        });

        device.createComputePipeline({
            layout: 'auto',
            compute: { module: workgroupShader, entryPoint: 'main' }
        });
        capabilities.workgroupFeatures = true;

    } catch (e) {
        capabilities.error = e.toString();
    }

    return capabilities;
}
