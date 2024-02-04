import { GrStatusGoodSmall } from 'react-icons/gr';
import { MdDelete, MdEdit } from 'react-icons/md';
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
      <td>{sensors.map(s => s.sensor_name).join(", ")}</td>
      <td className="row_options">
        <MdDelete 
          onClick={() => {
            const prompt = window.confirm(
              `Opravdu si přejete smazat skupinu ${groupName}?`
            );
            if (!prompt) return;
            removeGroup(groupId);
          }}
          title="Smazat skupinu"
        />
        <MdEdit onClick={openModal} title="Upravit skupinu" />
      </td>
    </tr>
  );
}

export default GroupRow;
