import { GrStatusGoodSmall } from 'react-icons/gr';
import { MdDelete, MdRemoveRedEye } from 'react-icons/md';
import { SensorGroup } from '../types';

interface GroupRowProps {
  group: SensorGroup;
  handleRemove: () => void;
  handleDetail: () => void;
}
function GroupRow({ group, handleRemove, handleDetail }: GroupRowProps) {
  return (
    <tr>
      <td style={{ color: group.group_color }}>
        <GrStatusGoodSmall size={25} />
      </td>
      <td>{group.group_name}</td>
      <td className="overflow-hidden box-border">
        <span className="inline-block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {group.sensors.map((s) => s.sensor_name).join(', ')}
        </span>
      </td>
      <td className="h-full gap-2">
        <button
          className="bg-transparent border-none hover:bg-transparent hover:text-gray-700"
          title="Smazat skupinu"
          onClick={handleRemove}
        >
          <MdDelete size={26} />
        </button>
        <button
          className="bg-transparent border-none hover:bg-transparent hover:text-gray-700"
          title="Zobrazit detaily"
          onClick={handleDetail}
        >
          <MdRemoveRedEye size={26} />
        </button>
      </td>
    </tr>
  );
}

export default GroupRow;
