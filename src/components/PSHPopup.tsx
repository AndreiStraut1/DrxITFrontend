import React from "react";
import "./PSHPopup.css";

interface PSHPopupProps {
  setTrigger(value: boolean): void;
  trigger: boolean;
  children: React.ReactNode;
}

function PSHPopup(props: PSHPopupProps) {
  return props.trigger ? (
    <div className="popup">
      <div className="popup-inner">
        <button className="close-btn" onClick={() => props.setTrigger(false)}>
          close
        </button>
        {props.children}
      </div>
    </div>
  ) : (
    ""
  );
}

export default PSHPopup;
