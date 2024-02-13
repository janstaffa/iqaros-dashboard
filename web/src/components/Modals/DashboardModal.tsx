import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DataContext } from '../../App';
import { APP_API_BASE_PATH } from '../../config';
import {
  DataParameter,
  GenericApiResponse,
  Tile,
  TileArgument,
  TileArgumentType,
  TileArgumentValue,
  TileOperation,
} from '../../types';
import CustomModal from '../CustomModal';

export interface FlowCardProps {
  isVisible?: boolean;
  title?: string;
  children: JSX.Element;
  showTail?: boolean;
}

const FlowCard: React.FC<FlowCardProps> = ({
  isVisible = true,
  title,
  children,
  showTail = true,
}) => {
  return (
    <div
      className={
        'flow_card border p-3 bg-white shadow-sm rounded my-2 flex flex-col relative z-10' +
        (!showTail ? ' tail_hidden' : '')
      }
      style={{ display: isVisible ? 'flex' : 'none' }}
    >
      {title && <div className="font-bold">{title}</div>}
      <div className="flex flex-row gap-2">{children}</div>
    </div>
  );
};

export interface FlowProps {
  steps: JSX.Element[];
}

const Flow: React.FC<FlowProps> = ({ steps }) => {
  return <div className="flex flex-col items-center">{steps}</div>;
};

export interface DashboardModalProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  tileList: Tile[];
  fetchTileList: () => void;
  editedTile: Tile | null;
}

const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  setIsOpen,
  tileList,
  fetchTileList,
  editedTile,
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

  useEffect(() => {
    if (editedTile === null) {
      setTileTitle('');
      setParameter(null);
      setArgument1(null);
      setArgument1Value(null);
      setOperation(null);
      setArgument2(null);
      setArgument2Value(null);
      setShowGraphic(false);
      return;
    }

    setTileTitle(editedTile.title);
    setParameter(editedTile.parameter);
    setArgument1({ id: editedTile.arg1, type: editedTile.arg1_type });
    setArgument1Value(editedTile.arg1_value);
    setOperation(editedTile.operation);
    if (editedTile.arg2 !== null && editedTile.arg2_type !== null) {
      setArgument2({ id: editedTile.arg2, type: editedTile.arg2_type });
    }
    setArgument2Value(editedTile.arg2_value);
    setShowGraphic(editedTile.show_graphic);
  }, [isOpen, editedTile]);

  async function postTile(
    ID: number | null,
    title: string,
    order: number | null,
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
        ID,
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
        credentials: 'include',
      })
        .then((data) => data.json())
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
          throw e;
        });
    });
  }

  return (
    <CustomModal
      isOpen={isOpen}
      title={editedTile === null ? 'Nová dlaždice' : editedTile.title}
      handleClose={() => setIsOpen(false)}
      content={
        <div className="flex flex-col w-full h-full">
          <div className="flex-shrink">
            <table>
              <tr>
                <td className="font-bold pr-5 border p-2">Název:</td>
                <td className="border p-2">
                  <input
                    type="text"
                    value={tileTitle}
                    onChange={(e) => {
                      setTileTitle(e.target.value);
                    }}
                  />
                </td>
              </tr>
            </table>
            {/* <table>
              <tbody>
                <tr>
                </tr>
                <tr>
                  <td className="font-bold pr-5 border p-2">Parametr:</td>
                  <td className="border p-2">
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
                  </td>
                </tr>
              </tbody>
            </table> */}
          </div>
          <div className="flex-grow flex flex-col items-center">
            <Flow
              steps={[
                <FlowCard title="Parametr" showTail={false}>
                  <select
                    value={parameter !== null ? parameter : undefined}
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
                </FlowCard>,
                <FlowCard title="První argument" isVisible={parameter !== null}>
                  <>
                    <select
                      value={
                        argument1 !== null
                          ? `${
                              argument1.type === TileArgumentType.Sensor
                                ? 's'
                                : 'g'
                            }-${argument1.id}`
                          : undefined
                      }
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
                    <select
                      value={
                        argument1Value !== null ? argument1Value : undefined
                      }
                      onChange={(e) =>
                        setArgument1Value(parseInt(e.target.value))
                      }
                      style={{
                        visibility:
                          argument1 && argument1.type === TileArgumentType.Group
                            ? 'visible'
                            : 'hidden',
                      }}
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
                  </>
                </FlowCard>,
                <FlowCard
                  isVisible={
                    argument1 !== null &&
                    (argument1.type === TileArgumentType.Sensor ||
                      argument1Value !== null)
                  }
                  title="Operace"
                >
                  <select
                    value={operation !== null ? operation : undefined}
                    onChange={(e) => setOperation(parseInt(e.target.value))}
                  >
                    <option disabled selected hidden>
                      -- vyberte --
                    </option>
                    <option value={TileOperation.Display}>Zobrazit</option>
                    <option value={TileOperation.Difference}>Rozdíl</option>
                  </select>
                </FlowCard>,
                <FlowCard
                  isVisible={operation === TileOperation.Difference}
                  title="Druhý argument"
                >
                  <>
                    <select
                      value={
                        argument2 !== null
                          ? `${
                              argument2.type === TileArgumentType.Sensor
                                ? 's'
                                : 'g'
                            }-${argument2.id}`
                          : undefined
                      }
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
                    <select
                      value={
                        argument2Value !== null ? argument2Value : undefined
                      }
                      style={{
                        visibility:
                          argument2 && argument2.type === TileArgumentType.Group
                            ? 'visible'
                            : 'hidden',
                      }}
                      onChange={(e) =>
                        setArgument2Value(parseInt(e.target.value))
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
                  </>
                </FlowCard>,
                <FlowCard
                  isVisible={
                    operation !== null &&
                    (parameter === DataParameter.Temperature ||
                      parameter === DataParameter.Humidity) &&
                    (operation === TileOperation.Display ||
                      (argument2 !== null &&
                        (argument2.type === TileArgumentType.Sensor ||
                          argument2Value !== null)))
                  }
                >
                  <>
                    <input
                      type="checkbox"
                      id="show_graphic_checkbox"
                      checked={showGraphic}
                      onChange={(e) => setShowGraphic(e.target.checked)}
                    />
                    <label
                      className="font-bold"
                      htmlFor="show_graphic_checkbox"
                    >
                      Zobrazit grafiku
                    </label>
                  </>
                </FlowCard>,
                <FlowCard
                  isVisible={
                    argument1 !== null &&
                    (argument1.type === TileArgumentType.Sensor ||
                      argument1Value !== null) &&
                    operation !== null &&
                    (operation === TileOperation.Display ||
                      (argument2 !== null &&
                        (argument2.type === TileArgumentType.Sensor ||
                          argument2Value !== null)))
                  }
                >
                  <button
                    onClick={async () => {
                      if (tileTitle.length === 0)
                        return toast.error('Název dlaždice nesmí být prázdný');

                      if (
                        operation === null ||
                        parameter === null ||
                        argument1 === null ||
                        (argument1.type === TileArgumentType.Group &&
                          argument1Value === null) ||
                        (operation === TileOperation.Difference &&
                          (argument2 === null ||
                            (argument2.type === TileArgumentType.Group &&
                              argument2Value === null)))
                      )
                        return toast.error('Chbějící údaje');

                      try {
                        await postTile(
                          editedTile?.ID || null,
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
                        toast.success(
                          editedTile === null
                            ? 'Nová dlaždice byla přidána'
                            : 'Dlaždice byla uložena'
                        );
                        fetchTileList();
                        setIsOpen(false);
                      } catch (_) {}
                    }}
                  >
                    {editedTile === null ? 'Přidat' : 'Uložit'}
                  </button>
                </FlowCard>,
              ]}
            />
          </div>
        </div>
      }
      footer={null}
    />
  );
};

export default DashboardModal;
