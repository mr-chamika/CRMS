import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto animate-slideIn">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-gray-800 m-0">{title}</h3>
                    <button
                        className="bg-none border-none text-2xl text-gray-500 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-200 hover:text-gray-700"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;