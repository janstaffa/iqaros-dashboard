import { useContext, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { GrStatusGoodSmall } from 'react-icons/gr';
import Modal from 'react-modal';
import Plot from 'react-plotly.js';
import { toast } from 'react-toastify';
import { DataContext, FunctionContext } from '../../App';
import { APP_API_BASE_PATH } from '../../constants';
import { Sensor } from '../../types';

export interface SensorModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  sensor: Sensor;
  onClose?: () => void;
}

const SensorModal: React.FC<SensorModalProps> = ({
  isOpen,
  setIsOpen,
  sensor,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [checkedGroups, setCheckedGroups] = useState<number[]>([]);

  useEffect(() => {
    setNameInput(sensor.sensor_name);
    setCheckedGroups(sensor.groups.map((g) => g.group_id));
  }, [sensor]);

  async function postEditedSensor(
    sensorId: number,
    newSensorName: string,
    newCheckedGroups: number[]
  ) {
    return new Promise((res, rej) => {
      const payload = {
        sensorId,
        newSensorName,
        newCheckedGroups,
      };
      fetch(APP_API_BASE_PATH + '/edit_sensor', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((data) => data.json())
        .then((parsed_data) => {
          res(null);
        })
        .catch((e) => {
          console.error(e);
          rej(e);
        });
    });
  }

  const data = useContext(DataContext);
  const functions = useContext(FunctionContext);

  return (
    <Modal
      isOpen={isOpen}
      style={{ content: { padding: '20px' }, overlay: { zIndex: 11 } }}
      onAfterClose={onClose}
    >
      <div className="modal sensor_modal">
        <div className="modal-header">
          <h2>{sensor.sensor_name}</h2>
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
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>Skupiny:</td>
                <td>
                  <div className="group_list_wrap">
                    {data.groupList.map((g, idx) => {
                      const elementId = `group_${g.group_id}`;
                      return (
                        <div key={idx}>
                          <input
                            type="checkbox"
                            id={elementId}
                            checked={checkedGroups.includes(g.group_id)}
                            onChange={(e) => {
                              if (e.target.checked === true) {
                                if (!checkedGroups.includes(g.group_id)) {
                                  setCheckedGroups([
                                    ...checkedGroups,
                                    g.group_id,
                                  ]);
                                }
                              } else {
                                const index = checkedGroups.findIndex(
                                  (x) => x === g.group_id
                                );
                                if (index > -1) {
                                  const newCheckedGroups = [...checkedGroups];
                                  newCheckedGroups.splice(index, 1);
                                  setCheckedGroups(newCheckedGroups);
                                }
                              }
                            }}
                          />
                          <label htmlFor={elementId}>
                            <GrStatusGoodSmall color={g.group_color} />
                            {g.group_name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <Plot
            data={[
              {
                x: [1, 2, 3],

                y: [2, 6, 3],

                type: 'scatter',

                mode: 'lines+markers',

                marker: { color: 'red' },
              },

              { type: 'bar', x: [1, 2, 3], y: [2, 5, 3] },
            ]}
            layout={{ width: 320, height: 240, title: 'A Fancy Plot' }}
          />
        </div>
        <div className="modal-footer">
          <button
            onClick={async () => {
              await postEditedSensor(
                sensor.sensor_id,
                nameInput,
                checkedGroups
              );
              toast.success('Změny byly uloženy');
              setIsOpen(false);
              functions.fetchSensorList();
            }}
          >
            Uložit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SensorModal;
