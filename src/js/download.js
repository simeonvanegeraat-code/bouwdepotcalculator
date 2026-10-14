/**
 * Een bestand dat in de browser is gemaakt aan de bezoeker geven, als download.
 * Er gaat niets naar een server: het bestand bestaat alleen op zijn apparaat.
 */

/** @param {Uint8Array} bytes  @param {string} naam  @param {string} type */
export function geefDownload(bytes, naam, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes], { type }));
    link.download = naam;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
