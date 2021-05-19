import './drawer-button.css';
import React, { useState } from 'react';

function DrawerButton(props) {
  const [open, setOpen] = useState(false);
  
  return (
    <div id="container">
      <div onClick={() => setOpen(!open)} id="name">
      {props.name}
      </div>
      {open ? 
        <div className={open ? "open" : "closed"} id="description">
        {Object.entries(props.description).map(el => <p>{el}</p>)}
        </div>
        : undefined}
      </div>
  );
}

export default DrawerButton;
