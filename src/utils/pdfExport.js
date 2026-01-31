import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export dashboard to PDF
 * @param {HTMLElement} element - The DOM element to export
 * @param {string} filename - The output PDF filename
 */
export async function exportToPDF(element, filename = 'trim_sheet.pdf') {
  try {
    // Show loading indicator
    const loadingOverlay = document.createElement('div');
    loadingOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
        ">
          <div style="
            border: 4px solid #3b82f6;
            border-top-color: transparent;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            margin: 0 auto 20px;
            animation: spin 1s linear infinite;
          "></div>
          <p style="font-weight: bold; color: #1f2937;">Generating PDF...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add metadata
    pdf.setProperties({
      title: 'Aircraft Load & Trim Sheet',
      subject: 'AI-Generated Load Planning Document',
      author: 'AI Load Planning System',
      keywords: 'aircraft, load planning, weight and balance, trim sheet',
      creator: 'AI-Powered Load Planning System v1.0'
    });

    // Save PDF
    pdf.save(filename);

    // Remove loading overlay
    document.body.removeChild(loadingOverlay);
    document.head.removeChild(style);

    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Failed to generate PDF. Please try again.');
    return false;
  }
}

/**
 * Print dashboard
 */
export function printDashboard() {
  window.print();
}
