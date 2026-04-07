const si = require('systeminformation');

async function getDiskData() {
  const disks = await si.fsSize();
  const bytesToGb = (bytes) => Number((bytes / 1e9).toFixed(2));
  const bytesToGiB = (bytes) => Number((bytes / (1024 ** 3)).toFixed(2));
  const bytesToMiB = (bytes) => Number((bytes / (1024 ** 2)).toFixed(2));
  const formatExplorerTotal = (totalGiB) => `${Math.round(totalGiB)} GB`;
  const formatExplorerFree = (freeBytes, freeGiB) => {
    if (freeGiB >= 1) return `${freeGiB.toFixed(1)} GB`;
    return `${Math.round(bytesToMiB(freeBytes))} MB`;
  };

  return disks.map((disk) => {
    const totalBytes = disk.size ?? 0;
    const usedBytes = disk.used ?? 0;
    const freeBytes = disk.available ?? Math.max(totalBytes - usedBytes, 0);

    const totalGb = bytesToGb(totalBytes);
    const usedGb = bytesToGb(usedBytes);
    const freeGb = bytesToGb(freeBytes);

    const totalGiB = bytesToGiB(totalBytes);
    const usedGiB = bytesToGiB(usedBytes);
    const freeGiB = bytesToGiB(freeBytes);
    const explorerTotal = formatExplorerTotal(totalGiB);
    const explorerFree = formatExplorerFree(freeBytes, freeGiB);

    return {
    //   mount: disk.mount,
    //   type: disk.type,
    //   totalGb,
    //   usedGb,
    //   freeGb,
    //   totalGiB,
    //   usedGiB,
    //   freeGiB,
    filesystem: disk.mount ?? disk.fs,
    fs: disk.fs,
    mount: disk.mount,
    explorerTotal,
      explorerFree,
      explorerText: `${explorerFree} free of ${explorerTotal}`,
      usePercent: disk.use
    };
  });
}

module.exports = { getDiskData };

