async function collectSensors() {
    const sensors = {
        // Modern Generic Sensor API
        accelerometer: "Accelerometer" in window,
        gyroscope: "Gyroscope" in window,
        magnetometer: "Magnetometer" in window,
        linearAcceleration: "LinearAccelerationSensor" in window,
        gravity: "GravitySensor" in window,
        absoluteOrientation: "AbsoluteOrientationSensor" in window,
        relativeOrientation: "RelativeOrientationSensor" in window,

        // Legacy events
        deviceMotion: "DeviceMotionEvent" in window,
        deviceOrientation: "DeviceOrientationEvent" in window,

        // Other sensors
        proximity: "ondeviceproximity" in window || "ProximitySensor" in window,
        ambientLight: "AmbientLightSensor" in window,

        // Vibration
        vibration: "vibrate" in navigator,
    };

    // Functional sensor checks — try to instantiate and read a value
    const sensorTests = [
        { name: "accelerometer", ctor: "Accelerometer", fields: ["x", "y", "z"] },
        { name: "gyroscope", ctor: "Gyroscope", fields: ["x", "y", "z"] },
        { name: "magnetometer", ctor: "Magnetometer", fields: ["x", "y", "z"] },
        { name: "linearAcceleration", ctor: "LinearAccelerationSensor", fields: ["x", "y", "z"] },
    ];

    for (const test of sensorTests) {
        if (!sensors[test.name]) continue;
        try {
            const sensor = new window[test.ctor]({ frequency: 10 });
            const result = await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    sensor.stop();
                    resolve({ functional: false, reason: "timeout" });
                }, 500);
                sensor.addEventListener("reading", () => {
                    clearTimeout(timeout);
                    const reading = {};
                    for (const f of test.fields) reading[f] = sensor[f];
                    sensor.stop();
                    resolve({ functional: true, reading });
                }, { once: true });
                sensor.addEventListener("error", (e) => {
                    clearTimeout(timeout);
                    sensor.stop();
                    resolve({ functional: false, reason: e.error?.name || e.error?.message || "error" });
                }, { once: true });
                sensor.start();
            });
            sensors[test.name + "Result"] = result;
        } catch (e) {
            sensors[test.name + "Result"] = { functional: false, reason: e.name || e.message };
        }
    }

    // Permission states for sensors
    try {
        if (navigator.permissions) {
            const perms = ["accelerometer", "gyroscope", "magnetometer"];
            for (const name of perms) {
                try {
                    const status = await navigator.permissions.query({ name });
                    sensors[name + "Permission"] = status.state;
                } catch (e) {
                    sensors[name + "Permission"] = "unsupported";
                }
            }
        }
    } catch (e) {
        // permissions API not available
    }

    return { sensors };
}
