import { useContext, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { MdAdd, MdSettings } from 'react-icons/md';
import Modal from 'react-modal';
import { DataContext } from '../App';
import DashboardTile from '../components/DashboardTile';

import {
  API_BASE_PATH,
  APP_API_BASE_PATH,
  POOLING_INTERVAL as POLING_INTERVAL,
} from '../constants';
import {
  DataParameter,
  FetchDataApiResponse,
  FetchDataDataWrapped,
  GenericApiResponse,
  Tile,
  TileArgument,
  TileArgumentType,
  TileArgumentValue,
  TileListApiResponse,
  TileOperation,
} from '../types';

function Dashboard() {
  const data = useContext(DataContext);

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [tileTitle, setTileTitle] = useState('');

  const [parameter, setParameter] = useState<DataParameter | null>(null);

  const [argument1, setArgument1] = useState<TileArgument | null>(null);
  const [argument1Value, setArgument1Value] =
    useState<TileArgumentValue | null>(null);

  const [operation, setOperation] = useState<TileOperation | null>(null);

  const [argument2, setArgument2] = useState<TileArgument | null>(null);
  const [argument2Value, setArgument2Value] =
    useState<TileArgumentValue | null>(null);

  const [tileList, setTileList] = useState<Tile[]>([]);

  const fetchTileList = () => {
    fetch(APP_API_BASE_PATH + '/tilelist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as TileListApiResponse;
        if (response.status === 'err') {
          console.error(response.message);
          return;
        }

        setTileList(response.data);
      })
      .catch((e) => {
        throw e;
      });
  };

  const [sensorData, setSensorData] = useState<FetchDataDataWrapped | null>(
    null
  );

  function fetchSensorData(sensorIds: number[]) {
    let query = `?sensorId=${sensorIds.join(',')}`;

    return fetch(API_BASE_PATH + '/fetchdata' + query)
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as FetchDataApiResponse;
        setSensorData(response.data);
      })
      .catch((e) => {
        throw e;
      });
  }

  useEffect(() => {
    fetchTileList();
  }, []);

  useEffect(() => {
    if (!data.sensorList) return;
    // let sensorIds: number[] = [];
    // for (const t of tileList) {
    //   if (t.arg1_type === TileArgumentType.Sensor) {
    //     if (!sensorIds.includes(t.arg1)) sensorIds.push(t.arg1);
    //   } else {
    //     const group = data.groupList.find((g) => g.group_id === t.arg1);
    //     if (group) {
    //       for (const s of group.sensors) {
    //         if (!sensorIds.includes(s.sensor_id)) sensorIds.push(s.sensor_id);
    //       }
    //     }
    //   }
    //   if (t.arg2 !== null && t.arg2_type !== null) {
    //     if (t.arg2_type === TileArgumentType.Sensor) {
    //       if (!sensorIds.includes(t.arg2)) sensorIds.push(t.arg2);
    //     } else {
    //       const group = data.groupList.find((g) => g.group_id === t.arg2);
    //       if (group) {
    //         for (const s of group.sensors) {
    //           if (!sensorIds.includes(s.sensor_id)) sensorIds.push(s.sensor_id);
    //         }
    //       }
    //     }
    //   }
    // }
    const sensorIds = data.sensorList.map((s) => s.sensor_id);

    if (sensorIds.length === 0) return;
    fetchSensorData(sensorIds);

    const poll = setInterval(() => fetchSensorData(sensorIds), POLING_INTERVAL);

    return () => {
      clearInterval(poll);
    };
  }, [data]);

  async function postTile(
    title: string,
    order: number,
    operation: number,
    parameter: DataParameter,
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

          res(null);
        })
        .catch((e) => {
          console.error(e);
          rej('Unknown error.');
        });
    });
  }

  function removeTile(tileId: number) {
    const payload = {
      tileId,
    };
    fetch(APP_API_BASE_PATH + '/removetile', {
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
          console.error(parsed_data.message);
          return;
        }
        fetchTileList();
      })
      .catch((e) => console.error(e));
  }

  const [isEditing, setIsEditing] = useState(false);
  return (
    <>
      <div className="floating_buttons">
        <button
          onClick={() => {
            setIsEditing(!isEditing);
          }}
        >
          <MdSettings />
        </button>
        <button
          onClick={() => {
            setModalIsOpen(true);
            setTileTitle('');
            setArgument1(null);
            setArgument1Value(null);
            setArgument2(null);
            setArgument2Value(null);
            setOperation(null);
            setParameter(null);
          }}
          title="Nová dlaždice"
        >
          <MdAdd />
        </button>
      </div>
      <div className={'dashboard' + (isEditing ? ' editing' : '')}>
        {sensorData &&
          tileList.map((t, idx) => (
            <DashboardTile
              tile={t}
              sensorData={sensorData}
              groupList={data.groupList}
              isEditing={isEditing}
              remove={() => removeTile(t.ID)}
              key={idx}
            />
          ))}
      </div>
      <Modal
        isOpen={modalIsOpen}
        style={{ content: { padding: '20px' }, overlay: { zIndex: 10000 } }}
      >
        <div className="modal map_modal">
          <div className="modal-header">
            <h2>Nová dlaždice</h2>
            <FaTimes
              onClick={() => {
                setModalIsOpen(false);
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
                          {operation &&
                          operation === TileOperation.Difference ? (
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
                                      <option
                                        value={`g-${g.group_id}`}
                                        key={idx}
                                      >
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
                  await postTile(
                    tileTitle,
                    tileList.length + 1,
                    operation,
                    parameter,
                    argument1,
                    argument1.type === TileArgumentType.Sensor
                      ? TileArgumentValue.Value
                      : argument1Value!,
                    argument2,
                    argument2Value
                  );
                  fetchTileList();
                  setModalIsOpen(false);
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
    </>
  );
}

export default Dashboard;
