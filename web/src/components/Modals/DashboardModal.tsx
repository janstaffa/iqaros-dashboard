import { useContext, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { DataContext } from '../../App';
import { APP_API_BASE_PATH } from '../../constants';
import {
	DataParameter,
	GenericApiResponse,
	Tile,
	TileArgument,
	TileArgumentType,
	TileArgumentValue,
	TileOperation,
} from '../../types';

export interface DashboardModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  tileList: Tile[];
  fetchTileList: () => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  setIsOpen,
  tileList,
  fetchTileList,
}) => {
  const data = useContext(DataContext);
  const [tileTitle, setTileTitle] = useState('');

  const [parameter, setParameter] = useState<DataParameter | null>(null);

  const [argument1, setArgument1] = useState<TileArgument | null>(null);
  const [argument1Value, setArgument1Value] =
    useState<TileArgumentValue | null>(null);

  const [operation, setOperation] = useState<TileOperation | null>(null);

  const [argument2, setArgument2] = useState<TileArgument | null>(null);
  const [argument2Value, setArgument2Value] =
    useState<TileArgumentValue | null>(null);

  const [showGraphic, setShowGraphic] = useState(false);

  async function postNewTile(
    title: string,
    order: number,
    operation: number,
    parameter: DataParameter,
    show_graphic: boolean,
    arg1: TileArgument,
    arg1_value: TileArgumentValue,
    arg2?: TileArgument | null,
    arg2_value?: TileArgumentValue | null
  ) {
    return new Promise((res, rej) => {
      const payload = {
        title,
        order,
        arg1: arg1.id,
        arg1_type: arg1.type,
        arg1_value,
        arg2: arg2?.id,
        arg2_type: arg2?.type,
        arg2_value,
        operation,
        parameter,
        show_graphic,
      };
      fetch(APP_API_BASE_PATH + '/posttile', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((data) => data.json())
        .then((parsed_data: GenericApiResponse) => {
          if (parsed_data.status === 'err') {
            return rej(parsed_data.message!);
          }

          toast.success('Nová dlaždice byla přidána');
          res(null);
        })
        .catch((e) => {
          console.error(e);
          rej('Unknown error.');
        });
    });
  }
  return (
    <Modal
      isOpen={isOpen}
      style={{ content: { padding: '20px' }, overlay: { zIndex: 10000 } }}
    >
      <div className="modal map_modal">
        <div className="modal-header">
          <h2>Nová dlaždice</h2>
          <FaTimes
            onClick={() => {
              setIsOpen(false);
            }}
          />
        </div>
        <div className="modal_content">
          <div>
            <table>
              <tbody>
                <tr>
                  <td>Název:</td>
                  <td>
                    <input
                      type="text"
                      value={tileTitle}
                      onChange={(e) => {
                        setTileTitle(e.target.value);
                      }}
                    />
                  </td>
                </tr>
                <br />
                <tr>
                  <td>Parametr:</td>
                  <select
                    onChange={(e) => setParameter(parseInt(e.target.value))}
                  >
                    <option disabled selected hidden>
                      -- vyberte --
                    </option>
                    <option value={DataParameter.Temperature}>Teplota</option>
                    <option value={DataParameter.Humidity}>Vlhkost</option>
                    <option value={DataParameter.RSSI}>Signál</option>
                    <option value={DataParameter.Voltage}>Napětí</option>
                  </select>
                </tr>
                {parameter !== null && (
                  <>
                    <tr>
                      <td>První argument:</td>
                      <td>
                        <select
                          onChange={(e) => {
                            const parts = e.target.value.split('-');
                            const type =
                              parts[0] === 's'
                                ? TileArgumentType.Sensor
                                : TileArgumentType.Group;
                            setArgument1({
                              id: parseInt(parts[1]),
                              type,
                            });
                          }}
                        >
                          <option disabled selected hidden>
                            -- vyberte --
                          </option>
                          <optgroup label="Senzory">
                            {data.sensorList.map((s, idx) => (
                              <option value={`s-${s.sensor_id}`} key={idx}>
                                {s.sensor_name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Skupiny">
                            {data.groupList.map((g, idx) => (
                              <option value={`g-${g.group_id}`} key={idx}>
                                {g.group_name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </td>

                      {argument1 &&
                        argument1.type === TileArgumentType.Group && (
                          <td>
                            <select
                              onChange={(e) =>
                                setArgument1Value(parseInt(e.target.value))
                              }
                            >
                              <option disabled selected hidden>
                                -- vyberte --
                              </option>
                              <option value={TileArgumentValue.Average}>
                                Průměrná hodnota
                              </option>
                              <option value={TileArgumentValue.Min}>
                                Nejnižší hodnota
                              </option>
                              <option value={TileArgumentValue.Max}>
                                Nejvyšší hodnota
                              </option>
                            </select>
                          </td>
                        )}
                    </tr>
                    {argument1 && (
                      <>
                        <tr>
                          <td>Operace:</td>
                          <td>
                            <select
                              onChange={(e) =>
                                setOperation(parseInt(e.target.value))
                              }
                            >
                              <option disabled selected hidden>
                                -- vyberte --
                              </option>
                              <option value={TileOperation.Display}>
                                Zobrazit
                              </option>
                              <option value={TileOperation.Difference}>
                                Rozdíl
                              </option>
                            </select>
                          </td>
                        </tr>
                        {operation && operation === TileOperation.Difference ? (
                          <tr>
                            <td>Druhý argument:</td>
                            <td>
                              <select
                                onChange={(e) => {
                                  const parts = e.target.value.split('-');
                                  const type =
                                    parts[0] === 's'
                                      ? TileArgumentType.Sensor
                                      : TileArgumentType.Group;
                                  setArgument2({
                                    id: parseInt(parts[1]),
                                    type,
                                  });
                                }}
                              >
                                <option disabled selected hidden>
                                  -- vyberte --
                                </option>
                                <optgroup label="Senzory">
                                  {data.sensorList.map((s, idx) => (
                                    <option
                                      value={`s-${s.sensor_id}`}
                                      key={idx}
                                    >
                                      {s.sensor_name}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Skupiny">
                                  {data.groupList.map((g, idx) => (
                                    <option value={`g-${g.group_id}`} key={idx}>
                                      {g.group_name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>
                            {argument2 &&
                              argument2.type === TileArgumentType.Group && (
                                <td>
                                  <select
                                    onChange={(e) =>
                                      setArgument2Value(
                                        parseInt(e.target.value)
                                      )
                                    }
                                  >
                                    <option disabled selected hidden>
                                      -- vyberte --
                                    </option>
                                    <option value={TileArgumentValue.Average}>
                                      Průměrná hodnota
                                    </option>
                                    <option value={TileArgumentValue.Min}>
                                      Nejnižší hodnota
                                    </option>
                                    <option value={TileArgumentValue.Max}>
                                      Nejvyšší hodnota
                                    </option>
                                  </select>
                                </td>
                              )}
                          </tr>
                        ) : null}
                        {operation !== null &&
                          (parameter === DataParameter.Temperature ||
                            parameter === DataParameter.Humidity) && (
                            <tr>
                              <td>Zobrazit grafiku: </td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={showGraphic}
                                  onChange={(e) =>
                                    setShowGraphic(e.target.checked)
                                  }
                                />
                              </td>
                            </tr>
                          )}
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button
            onClick={async () => {
              if (
                tileTitle === null ||
                operation === null ||
                parameter === null ||
                argument1 === null ||
                (argument1.type === TileArgumentType.Group &&
                  argument1Value === null)
              )
                return;

              try {
                await postNewTile(
                  tileTitle,
                  tileList.length + 1,
                  operation,
                  parameter,
                  showGraphic,
                  argument1,
                  argument1.type === TileArgumentType.Sensor
                    ? TileArgumentValue.Value
                    : argument1Value!,
                  argument2,
                  argument2Value
                );
                fetchTileList();
                setIsOpen(false);
              } catch (e) {
                console.log(e);
              }
            }}
          >
            Přidat
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DashboardModal;
