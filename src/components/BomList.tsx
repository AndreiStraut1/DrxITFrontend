import { Bom } from "../models/Bom";

interface BomProps {
  bomData: Bom;
}

const BomList: React.FC<BomProps> = ({ bomData }) => {
  return (
    <div>
      <h3>Bom</h3>
      <strong>BOM Name</strong>:{" "}
      {!bomData.name || bomData.name.trim() === "" ? "N/A" : bomData.name}
      <ul>
        {bomData.bomMaterials.map((bomMaterial, index) => (
          <li key={index}>
            <strong>{bomMaterial.material.materialNumber}</strong>
            <ul>
              <li>
                <strong>Description</strong>:{" "}
                {bomMaterial.material.materialDescription}
              </li>
              <li>
                <strong>Height</strong>: {bomMaterial.material.height}
              </li>
              <li>
                <strong>Width</strong>: {bomMaterial.material.width}
              </li>
              <li>
                <strong>Weight</strong>: {bomMaterial.material.weight}
              </li>
            </ul>
            <strong>Quantity</strong>: {bomMaterial.quantity}
            <br></br>
            <strong>Unit Measure Code</strong>: {bomMaterial.unitMeasureCode}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BomList;
