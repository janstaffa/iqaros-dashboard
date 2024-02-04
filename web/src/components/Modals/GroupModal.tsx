import { useContext, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import { FunctionContext } from '../../App';
import { APP_API_BASE_PATH } from '../../constants';
import { GenericApiResponse, SensorGroup } from '../../types';

export interface GroupModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  displayedGroup: SensorGroup;
}

const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  setIsOpen,
  displayedGroup,
}) => {
  const functions = useContext(FunctionContext);

  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [groupColorInput, setGroupColorInput] = useState<string>('');

  useEffect(() => {
    setGroupNameInput(displayedGroup.group_name);
    setGroupColorInput(displayedGroup.group_color);
  }, [displayedGroup]);

  async function postEditedGroup(
    groupId: number,
    newName: string,
    newColor: string
  ) {
    return new Promise((res, rej) => {
      const payload = {
        groupId,
        newName,
        newColor,
      };
      fetch(APP_API_BASE_PATH + '/editgroup', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((data) => data.json())
        .then((parsed_data: GenericApiResponse) => {
          if (parsed_data.status !== 'ok') throw new Error('Request failed');
          res(null);
        })
        .catch((e) => {
          console.error(e);
          rej(e);
        });
    });
  }
  return (
    <Modal
      isOpen={isOpen}
      // style={customStyles}
      contentLabel="Example Modal"
      style={{ content: { padding: '20px' } }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{displayedGroup?.group_name}</h2>
          <FaTimes onClick={() => setIsOpen(false)} />
        </div>
        <div>
          <table>
            <tbody>
              <tr>
                <td>Název:</td>
                <td>
                  <input
                    type="text"
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>Barva:</td>
                <td>
                  <input
                    type="color"
                    value={groupColorInput}
                    onChange={(e) => setGroupColorInput(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>Senzory ve skupině:</td>
                <td>
                  <textarea
                    cols={30}
                    rows={1}
                    readOnly
                    style={{ maxWidth: '300px', maxHeight: '150px' }}
                  >
                    {displayedGroup?.sensors
                      .map((s) => s.sensor_name)
                      .join(', ')}
                  </textarea>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <button
            onClick={async () => {
              if (displayedGroup) {
                await postEditedGroup(
                  displayedGroup.group_id,
                  groupNameInput,
                  groupColorInput
                );
                functions.fetchGroupList();
              }
              setIsOpen(false);
            }}
          >
            Uložit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GroupModal;
