import React, { useState, useEffect } from "react";
import "./EditMessageModal.css";

export default function EditMessageModal({ isOpen, onClose, onSave, initialText }) {

    const [text, setText] = useState(initialText || "");

    useEffect(() => {
        setText(initialText || "");
    }, [initialText]);

    if (!isOpen) return null;

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal">
                <h3>Edit Message</h3>
                <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                />
                <div className="edit-modal-buttons">
                    <button onClick={onClose} className="edit-cancel-btn">Cancel</button>
                    <button onClick={() => onSave(text)} className="edit-save-btn">Save</button>
                </div>
            </div>
        </div>
    )
}
