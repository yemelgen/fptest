const WEBGL_PARAMETERS = [
    // High entropy limits
    'MAX_TEXTURE_SIZE',
    'MAX_CUBE_MAP_TEXTURE_SIZE',
    'MAX_RENDERBUFFER_SIZE',
    'MAX_VIEWPORT_DIMS',
    'MAX_VERTEX_ATTRIBS',
    'MAX_VERTEX_UNIFORM_VECTORS',
    'MAX_FRAGMENT_UNIFORM_VECTORS',
    'MAX_VARYING_VECTORS',
    'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
    'MAX_TEXTURE_IMAGE_UNITS',
    'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
    'MAX_ELEMENTS_VERTICES',
    'MAX_ELEMENTS_INDICES',
    'ALIASED_POINT_SIZE_RANGE',
    'ALIASED_LINE_WIDTH_RANGE',

    // GLSL / vendor strings
    'SHADING_LANGUAGE_VERSION',
    'VERSION',
    'RENDERER',
    'VENDOR',

    // WebGL2 uniform component limits
    'MAX_VERTEX_UNIFORM_COMPONENTS',
    'MAX_FRAGMENT_UNIFORM_COMPONENTS',
    'MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS',
    'MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS',

    // Texture / LOD / sampling
    'MAX_TEXTURE_LOD_BIAS',
    'MAX_ARRAY_TEXTURE_LAYERS',
    'MAX_3D_TEXTURE_SIZE',

    // Draw buffers / color attachments
    'MAX_DRAW_BUFFERS',
    'MAX_COLOR_ATTACHMENTS',
    'MAX_SAMPLES',

    // Transform feedback
    'MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS',
    'MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS',
    'MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS',

    // UBO limites 
    'MAX_VERTEX_UNIFORM_BLOCKS',
    'MAX_FRAGMENT_UNIFORM_BLOCKS',
    'MAX_COMBINED_UNIFORM_BLOCKS',
    'MAX_UNIFORM_BUFFER_BINDINGS',
    'MAX_UNIFORM_BLOCK_SIZE',
    'UNIFORM_BUFFER_OFFSET_ALIGNMENT',

    // IO / Component limits
    'MAX_VERTEX_OUTPUT_COMPONENTS',
    'MAX_FRAGMENT_INPUT_COMPONENTS',

    // Timeouts
    'MAX_SERVER_WAIT_TIMEOUT',
    'MAX_CLIENT_WAIT_TIMEOUT_WEBGL',

    // Mask defaults
    'SUBPIXEL_BITS',
    'STENCIL_VALUE_MASK',
    'STENCIL_BACK_VALUE_MASK',
    'STENCIL_WRITEMASK',
    'STENCIL_BACK_WRITEMASK',

    // Extra entropy
    'DEPTH_BITS',
    'STENCIL_BITS',
    'RED_BITS',
    'GREEN_BITS',
    'BLUE_BITS',
    'ALPHA_BITS',
    'POLYGON_OFFSET_UNITS',
    'POLYGON_OFFSET_FACTOR',
    'SAMPLE_BUFFERS',
    'SAMPLES',
    'SAMPLE_COVERAGE_VALUE',
    'SAMPLE_COVERAGE_INVERT',
    'UNPACK_ALIGNMENT',
    'PACK_ALIGNMENT',
    'VIEWPORT',
    'SCISSOR_BOX',
    'CULL_FACE_MODE',
    'FRONT_FACE',
    'BLEND_COLOR',
];

const WEBGL_EXTENSION_PARAMETERS = {
    WEBGL_debug_renderer_info: [
        "UNMASKED_VENDOR_WEBGL",
        "UNMASKED_RENDERER_WEBGL"
    ],
    EXT_texture_filter_anisotropic: [
        "MAX_TEXTURE_MAX_ANISOTROPY_EXT"
    ],
    EXT_color_buffer_float: [
        "MAX_RENDERBUFFER_SIZE"
    ],
    EXT_color_buffer_half_float: [
        "MAX_RENDERBUFFER_SIZE"
    ],
    WEBGL_compressed_texture_s3tc: [
        "COMPRESSED_TEXTURE_FORMATS"
    ],
    WEBGL_compressed_texture_s3tc_srgb: [
        "COMPRESSED_TEXTURE_FORMATS"
    ],
    WEBGL_compressed_texture_etc: [
        "COMPRESSED_TEXTURE_FORMATS"
    ],
    WEBGL_compressed_texture_etc1: [
        "COMPRESSED_TEXTURE_FORMATS"
    ],
    WEBGL_compressed_texture_pvrtc: [
        "COMPRESSED_TEXTURE_FORMATS"
    ],
    WEBGL_compressed_texture_astc: [
        "COMPRESSED_TEXTURE_FORMATS"
    ],
    EXT_shader_texture_lod: [],
    OES_texture_float: [],
    OES_texture_half_float: [],
    OES_element_index_uint: [],
    OES_vertex_array_object: [],
    WEBGL_lose_context: [],
};

async function collectVideoCard() {
    const canvas = document.createElement("canvas");
    const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl") ||
        canvas.getContext("webgl2");

    if (!gl) {
        return {
            videoCard: {
                supported: false
            }
        };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    if (!debugInfo) {
        return {
            videoCard: {
                supported: true,
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER)
            }
        };
    }

    return {
        videoCard: {
            supported: true,
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        }
    };
}

async function collectWebGL() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || 
                   canvas.getContext('webgl') || 
                   canvas.getContext('experimental-webgl');
        if (!gl) return { supported: false };

        const debug = gl.getExtension('WEBGL_debug_renderer_info');

        // Base capabilities
        const results = {
            supported: true,
            basicInfo: {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                contextType: isWebGL2(gl) ? "webgl2" : "webgl",
                version: gl.getParameter(gl.VERSION),
                shadingLangVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
                unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
            },

            // Context attributes
            contextAttributes: gl.getContextAttributes(),

            // Extensions
            extensions: gl.getSupportedExtensions(),
         
            // Parameters
            parameters : getWebGLParameters(gl),
            
            // Extension parameters
            extensionParameters: getExtensionParameters(gl),
            
            // Shader precision
            shaderPrecisions: {
                vertex: getShaderPrecisions(gl,"VERTEX_SHADER"),
                fragment: getShaderPrecisions(gl, "FRAGMENT_SHADER"),
            },
            
            // Extra probes
            shaderCompile: shaderCompileCheck(gl),
            internalFormats: getInternalFormats(gl),

            // Anti-aliasing info
            aaOffset: gl.getParameter(gl.SAMPLES),
            aaCapOffset: gl.getParameter(gl.SAMPLES) < gl.getParameter(gl.MAX_SAMPLES)
        };

        return { webgl: results };

    } catch (e) {
        return { webgl: { supported: false, error: e.toString() } };
    }
}

function isWebGL2(gl) {
    return typeof WebGL2RenderingContext !== 'undefined' && 
           gl instanceof WebGL2RenderingContext;
}

// Shader compile quirk test
function shaderCompileCheck(gl) {
    const src = "void main(){ gl_FragColor = vec4(0.5); }";
    const s = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS);
}

function getShaderPrecisions(gl, type) {
    const precisions = {};
    const kinds = [
        ['FLOAT', 'LOW_FLOAT'], ['FLOAT', 'MEDIUM_FLOAT'], ['FLOAT', 'HIGH_FLOAT'],
        ['INT', 'LOW_INT'], ['INT', 'MEDIUM_INT'], ['INT', 'HIGH_INT'],
    ];
    const shaderTypes = {
        VERTEX_SHADER: gl.VERTEX_SHADER,
        FRAGMENT_SHADER: gl.FRAGMENT_SHADER,
    };
    for (const [base, name] of kinds) {
        try {
            const fmt = gl.getShaderPrecisionFormat(shaderTypes[type], gl[name]);
            if (fmt) {
                precisions[name] = {
                    rangeMin: fmt.rangeMin,
                    rangeMax: fmt.rangeMax,
                    precision: fmt.precision,
                };
            }
        } catch (e) {
            precisions[name] = null;
        }
    }
    return precisions;
}

function getInternalFormats(gl) {
    if (!isWebGL2(gl)) return null;

    const formats = [
        gl.RGBA8, 
        gl.RGBA16F, 
        gl.RGBA32F,
        gl.DEPTH_COMPONENT16, 
        gl.DEPTH_COMPONENT24, 
        gl.DEPTH24_STENCIL8
    ];
    const results = {};
    for (const f of formats) {
        try {
            results[f] = gl.getInternalformatParameter(gl.RENDERBUFFER, f, gl.SAMPLES);
        } catch (e) {
            results[f] = null;
        }
    }
    return results;
}

function getWebGLParameters(gl) {
    const params = {};

    for (const name of WEBGL_PARAMETERS) {
        const constant = gl[name];
        if (typeof constant !== "number") {
            params[name] = null;
            continue;
        }
        try {
            params[name] = gl.getParameter(constant);
        } catch {
            params[name] = null; 
        }
    }

    return params;
}

function getExtensionParameters(gl) {
    const out = {};
    const extensions = gl.getSupportedExtensions() || [];

    for (const name of extensions) {
        const ext = gl.getExtension(name);
        if (!ext) continue;

        out[name] = {};
        const allowed = WEBGL_EXTENSION_PARAMETERS[name] || [];

        for (const paramName of allowed) {
            try {
                const enumValue = ext[paramName];
                out[name][paramName] = gl.getParameter(enumValue);
            } catch {
                out[name][paramName] = null;
            }
        }
    }

    return out;
}
