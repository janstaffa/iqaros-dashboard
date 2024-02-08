import { FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';

export interface CustomModalProps {
  isOpen: boolean;
  title: string;
  onClose?: () => void;
  handleClose: () => void;
  content: JSX.Element;
  footer: JSX.Element;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  handleClose,
  title,
  content,
  footer,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      style={{ content: { padding: '20px' }, overlay: { zIndex: 10000 } }}
      onAfterClose={onClose}
    >
      <div className="w-full h-full relative flex flex-col">
        <div className="w-full flex flex-row justify-between items-center flex-shrink mb-5">
          <h2 className="text-3xl">{title}</h2>
          <button
            onClick={() => handleClose()}
            className="cursor-pointer p-2 border-none bg-white hover:bg-white text-black hover:text-gray-500"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="flex-grow flex flex-row overflow-hidden gap-10">{content}</div>
        <div className="w-full flex-shrink mt-3 flex flex-row justify-end gap-2">{footer}</div>
      </div>
    </Modal>
  );
};

export default CustomModal;
