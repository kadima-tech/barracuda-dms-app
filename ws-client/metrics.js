const os = require("os");
const { execSync } = require("child_process");
const { log } = require("./logger");

/**
 * Gets the current CPU temperature
 * @returns {number|null} - Temperature in Celsius or null if not available
 */
function getTemperature() {
  try {
    // Method 1: Raspberry Pi specific
    const temp1 = execSync("vcgencmd measure_temp").toString().trim();
    const result1 = parseFloat(temp1.replace("temp=", "").replace("'C", ""));
    if (!isNaN(result1)) return result1;

    // Method 2: Generic Linux
    const temp2 = execSync("cat /sys/class/thermal/thermal_zone0/temp")
      .toString()
      .trim();
    const result2 = parseFloat(temp2) / 1000;
    if (!isNaN(result2)) return result2;

    // Method 3: Another generic approach
    const temp3 = execSync("sensors | grep 'Core 0' | awk '{print $3}'")
      .toString()
      .trim();
    const result3 = parseFloat(temp3.replace("+", "").replace("  C", ""));
    if (!isNaN(result3)) return result3;

    throw new Error("All temperature measurement methods failed");
  } catch (error) {
    log(`Error getting temperature: ${error}`);
    return null;
  }
}

/**
 * Gets the system uptime
 * @returns {number|null} - Uptime in seconds or null if not available
 */
function getUptime() {
  try {
    // Method 1: Node.js built-in
    const uptime1 = process.uptime();
    if (!isNaN(uptime1)) return uptime1;

    // Method 2: OS module
    const uptime2 = os.uptime();
    if (!isNaN(uptime2)) return uptime2;

    // Method 3: Reading from /proc/uptime
    const uptime3 = parseFloat(
      execSync("awk '{print $1}' /proc/uptime").toString().trim()
    );
    if (!isNaN(uptime3)) return uptime3;

    throw new Error("All uptime measurement methods failed");
  } catch (error) {
    log(`Error getting uptime: ${error}`);
    return null;
  }
}

/**
 * Gets the current CPU load
 * @returns {number|null} - CPU load percentage or null if not available
 */
function getCpuLoad() {
  try {
    // Method 1: top command
    const load1 = parseFloat(
      execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'")
        .toString()
        .trim()
    );
    if (!isNaN(load1)) return load1;

    // Method 2: mpstat command
    const load2 = parseFloat(
      execSync("mpstat 1 1 | awk '$12 ~ /[0-9.]+/ { print 100 - $12 }'")
        .toString()
        .trim()
    );
    if (!isNaN(load2)) return load2;

    // Method 3: OS module (average load over 1 minute)
    const load3 = os.loadavg()[0];
    if (!isNaN(load3)) return load3 * 100;

    throw new Error("All CPU load measurement methods failed");
  } catch (error) {
    log(`Error getting CPU load: ${error}`);
    return null;
  }
}

/**
 * Gets the current memory usage
 * @returns {number|null} - Memory usage percentage or null if not available
 */
function getMemoryUsage() {
  try {
    // Method 1: free command
    const mem1 = parseFloat(
      execSync("free | grep Mem | awk '{print $3/$2 * 100.0}'")
        .toString()
        .trim()
    );
    if (!isNaN(mem1)) return mem1;

    // Method 2: Another free command approach
    const mem2 = parseFloat(
      execSync("free -m | awk 'NR==2{printf \"%.2f\", $3*100/$2 }'")
        .toString()
        .trim()
    );
    if (!isNaN(mem2)) return mem2;

    // Method 3: OS module
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const mem3 = ((totalMem - freeMem) / totalMem) * 100;
    if (!isNaN(mem3)) return mem3;

    throw new Error("All memory usage measurement methods failed");
  } catch (error) {
    log(`Error getting memory usage: ${error}`);
    return null;
  }
}

/**
 * Gets the current disk usage
 * @returns {number|null} - Disk usage percentage or null if not available
 */
function getDiskUsage() {
  try {
    // Method 1: df command
    const disk1 = parseFloat(
      execSync("df -h / | awk 'NR==2 {print $5}'")
        .toString()
        .trim()
        .replace("%", "")
    );
    if (!isNaN(disk1)) return disk1;

    // Method 2: Another df command approach
    const disk2 = parseInt(
      execSync('df -h / | awk \'$NF=="/"{printf "%d", $5}\'').toString().trim()
    );
    if (!isNaN(disk2)) return disk2;

    // Method 3: du command (might be slow on large filesystems)
    const disk3 = parseFloat(
      execSync("du -sh / | awk '{print $1}'").toString().trim().replace("G", "")
    );
    if (!isNaN(disk3)) return (disk3 / os.totalmem()) * 1e9 * 100;

    throw new Error("All disk usage measurement methods failed");
  } catch (error) {
    log(`Error getting disk usage: ${error}`);
    return null;
  }
}

/**
 * Collects all system metrics
 * @returns {Object} - Object containing all system metrics
 */
function collectAllMetrics() {
  return {
    temperature: getTemperature(),
    uptime: getUptime(),
    cpuLoad: getCpuLoad(),
    memoryUsage: getMemoryUsage(),
    diskUsage: getDiskUsage(),
  };
}

module.exports = {
  getTemperature,
  getUptime,
  getCpuLoad,
  getMemoryUsage,
  getDiskUsage,
  collectAllMetrics,
};
