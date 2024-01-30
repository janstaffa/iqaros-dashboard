import { FaEdit, FaTrash } from 'react-icons/fa';
import { GrStatusGoodSmall } from 'react-icons/gr';
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
    <tr className="table_row">
      <td style={{ color: groupColor }}>
        <GrStatusGoodSmall size={25} />
      </td>
      <td>{groupName}</td>
      <td>{sensors.map(s => s.sensor_name).join(", ")}</td>
      <td className="table_row_options">
        <FaTrash
          onClick={() => {
            const prompt = window.confirm(
              `Opravdu si přejete smazat skupinu ${groupName}?`
            );
            if (!prompt) return;
            removeGroup(groupId);
          }}
          title="Smazat skupinu"
        />
        <FaEdit onClick={openModal} title="Upravit skupinu" />
      </td>
    </tr>
  );
}

export default GroupRow;
