import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Downloads a specific HTML Element as a PNG image.
 */
export const downloadAsImage = async (element: HTMLElement, filename: string) => {
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Export to image failed:', error);
    alert('导出图片失败，请重试');
  }
};

/**
 * Downloads a specific HTML Element as a PDF.
 * Uses a custom page size to fit the content exactly, avoiding cut-offs.
 */
export const downloadAsPDF = async (element: HTMLElement, filename: string) => {
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions in mm (approx 1px = 0.264583 mm)
    const pxToMm = 0.264583;
    const imgWidthMm = canvas.width * pxToMm;
    const imgHeightMm = canvas.height * pxToMm;

    // Create PDF with dimensions matching the content
    // 'p' = portrait, 'mm' = unit, [w, h] = custom size
    const pdf = new jsPDF({
      orientation: imgWidthMm > imgHeightMm ? 'l' : 'p',
      unit: 'mm',
      format: [imgWidthMm, imgHeightMm] 
    });

    // Add image filling the page
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
    pdf.save(`${filename}.pdf`);

  } catch (error) {
    console.error('Export to PDF failed:', error);
    alert('导出 PDF 失败，请重试');
  }
};