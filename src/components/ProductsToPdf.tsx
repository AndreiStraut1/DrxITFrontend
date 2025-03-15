import React, { useState } from "react";
import { Product } from "../models/Product";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProductPdfExportProps {
  products: Product[];
  className?: string;
}

class ProductPdfGenerator {
  static generateProductCatalog(products: Product[]): void {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Product Catalog", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 10;
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 10;
    products.forEach((product, index) => {
      if (yPosition > doc.internal.pageSize.height - 30) {
        doc.addPage();
        yPosition = 20;
      }

      if (index > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 10;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(41, 128, 185);
      doc.text(`${product.name} (ID: ${product.id})`, 15, yPosition);

      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      doc.text("Description:", 15, yPosition);

      const splitDescription = doc.splitTextToSize(
        product.description,
        pageWidth - 40
      );
      doc.text(splitDescription, 40, yPosition);

      yPosition += splitDescription.length * 5 + 5;

      doc.text(`Height: ${product.estimated_height}`, 15, yPosition);
      doc.text(`Width: ${product.estimated_width}`, 70, yPosition);
      doc.text(`Weight: ${product.estimated_weight}`, 125, yPosition);

      yPosition += 8;

      doc.text(
        `Current Stage: ${product.currentStage || "N/A"}`,
        15,
        yPosition
      );

      yPosition += 10;

      if (
        product.bom &&
        product.bom.bomMaterials &&
        product.bom.bomMaterials.length > 0
      ) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(
          `BIll of MAterials: ${product.bom.name || "Unnamed BOM"}`,
          15,
          yPosition
        );

        yPosition += 8;

        autoTable(doc, {
          head: [["Material", "Description", "Quantity", "Unit"]],
          body: product.bom.bomMaterials.map((material) => [
            material.material.materialNumber,
            material.material.materialDescription,
            material.quantity,
            material.unitMeasureCode,
          ]),
          startY: yPosition,
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 80 },
            2: { cellWidth: 25, halign: "right" },
            3: { cellWidth: 25 },
          },
          headStyles: {
            fillColor: [45, 62, 80],
            textColor: 255,
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.text("No BOM data available", 15, yPosition);
        yPosition += 15;
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
    }

    doc.save(`Product_Catalog_${new Date().toISOString().split("T")[0]}.pdf`);
  }
}

const ProductPdfExport: React.FC<ProductPdfExportProps> = ({
  products,
  className,
}) => {
  const handleExport = () => {
    try {
      ProductPdfGenerator.generateProductCatalog(products);
    } catch (error) {
      console.error("Error generating detailed PDF:", error);
    }
  };

  return (
    <div className={`pdf-export ${className || ""}`}>
      <div className="dropdown">
        <button
          className="btn btn-primary"
          type="button"
          onClick={handleExport}
        >
          <>
            <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
          </>
        </button>

        <ul className="dropdown-menu" aria-labelledby="pdfExportDropdown">
          <li>
            <button className="dropdown-item" onClick={handleExport}>
              Detailed Product List
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export { ProductPdfGenerator };
export default ProductPdfExport;
