import { GrStatusGoodSmall } from 'react-icons/gr';
import { MdDelete, MdRemoveRedEye } from 'react-icons/md';
import { BaseSensor } from '../types';

interface GroupRowProps {
  groupId: number;
  groupName: string;
  groupColor: string;
  sensors: BaseSensor[];
  removeGroup: (groupId: number) => void;
  openModal: () => void;
}
function GroupRow({
  groupId,
  groupColor,
  groupName,
  sensors,
  removeGroup,
  openModal,
}: GroupRowProps) {
  return (
    <tr>
      <td style={{ color: groupColor }}>
        <GrStatusGoodSmall size={25} />
      </td>
      <td>{groupName}</td>
      <td className="overflow-hidden box-border">
        <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {sensors.map((s) => s.sensor_name).join(', ')}
        </span>
      </td>
      <td className="h-full gap-2">
        <button
          className="bg-transparent border-none hover:bg-transparent hover:text-gray-700"
          title="Smazat skupinu"
          onClick={() => {
            const prompt = window.confirm(
              `Opravdu si přejete smazat skupinu ${groupName}?`
            );
            if (!prompt) return;
            removeGroup(groupId);
          }}
        >
          <MdDelete size={26} />
        </button>
        <button
          className="bg-transparent border-none hover:bg-transparent hover:text-gray-700"
          title="Zobrazit detaily"
          onClick={openModal}
        >
          <MdRemoveRedEye size={26} />
        </button>
      </td>
    </tr>
  );
}

export default GroupRow;
