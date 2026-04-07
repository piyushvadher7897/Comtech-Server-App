



// Add this function at the top of your component file
export function formatUptime(pmUptime) {
  if (!pmUptime || isNaN(pmUptime)) return 'N/A';
  const ms = Date.now() - pmUptime; // pmUptime is a timestamp
  if (ms < 0) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}