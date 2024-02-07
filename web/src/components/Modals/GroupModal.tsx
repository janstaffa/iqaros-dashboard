import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FunctionContext } from '../../App';
import { APP_API_BASE_PATH } from '../../constants';
import { GenericApiResponse, SensorGroup } from '../../types';
import CustomModal from '../CustomModal';

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
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
        });
    });
  }
  return (
    <CustomModal
      isOpen={isOpen}
      handleClose={() => setIsOpen(false)}
      title={`Skupina - ${displayedGroup?.group_name}`}
      content={
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
      }
      footer={
        <button
          onClick={async () => {
            if (displayedGroup) {
              try {
                await postEditedGroup(
                  displayedGroup.group_id,
                  groupNameInput,
                  groupColorInput
                );
                toast.success('Změny byly uloženy');
              } catch (_) {
                return;
              }
              functions.fetchGroupList();
            }
            setIsOpen(false);
          }}
        >
          Uložit
        </button>
      }
    />
  );
};

export default GroupModal;
