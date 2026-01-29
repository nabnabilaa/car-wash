import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  try {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-fit columns
    const colWidths = [];
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key) => {
        const maxLength = Math.max(
          key.length,
          ...data.map((row) => {
            const value = row[key];
            return value ? value.toString().length : 0;
          })
        );
        colWidths.push({ wch: Math.min(maxLength + 2, 50) });
      });
    }
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate and download file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const exportMultipleSheets = (sheets, filename) => {
  try {
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(({ data, sheetName }) => {
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Auto-fit columns
      const colWidths = [];
      if (data.length > 0) {
        Object.keys(data[0]).forEach((key) => {
          const maxLength = Math.max(
            key.length,
            ...data.map((row) => {
              const value = row[key];
              return value ? value.toString().length : 0;
            })
          );
          colWidths.push({ wch: Math.min(maxLength + 2, 50) });
        });
      }
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};