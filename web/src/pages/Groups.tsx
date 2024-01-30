import { useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import GroupRow from '../components/GroupRow';
import { APP_API_BASE_PATH } from '../constants';
import { GenericApiResponse, GroupListApiResponse, SensorGroup } from '../types';

function Groups() {
  const [groupList, setGroupList] = useState<SensorGroup[]>([]);
  const groupsListRef = useRef(groupList);
  groupsListRef.current = groupList;

  const fetchGroupList = () => {
    fetch(APP_API_BASE_PATH + '/grouplist')
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as GroupListApiResponse;
        console.log(response);
        setGroupList(response.data);
      })
      .catch((e) => {
        throw e;
      });
  };
  function createNewGroup() {
    fetch(APP_API_BASE_PATH + '/newgroup', {
      method: 'POST',
      mode: 'cors',
    })
      .then((data) => data.json())
      .then((parsed_data) => {
        setGroupList([parsed_data['data'], ...groupsListRef.current]);
      })
      .catch((e) => console.error(e));
  }
  function removeGroup(groupId: number) {
    const payload = {
      groupId,
    };
    fetch(APP_API_BASE_PATH + '/removegroup', {
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
        const newGroupList = [...groupsListRef.current];
        const filteredGroupList = newGroupList.filter(
          (g) => g.group_id !== groupId
        );
        setGroupList(filteredGroupList);
      })
      .catch((e) => console.error(e));
  }

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

  useEffect(() => {
    fetchGroupList();
  }, []);

  const [modalIsOpen, setIsOpen] = useState(false);
  const [displayedGroup, setDisplayedGroup] = useState<SensorGroup | null>(
    null
  );
  const [displayedGroupNameInput, setDisplayedGroupNameInput] =
    useState<string>('');
  const [displayedGroupColorInput, setDisplayedGroupColorInput] =
    useState<string>('');

  return (
    <>
      <div>
        <h1>Skupiny</h1>
        <button onClick={createNewGroup}>+ Nová skupina</button>
        <table className="styled_table">
          <thead>
            <tr>
              <td>Barva</td>
              <td>Název skupiny</td>
              <td>Senzory</td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {groupList &&
              groupList.map((group, idx) => {
                return (
                  <GroupRow
                    groupId={group.group_id}
                    groupColor={group.group_color}
                    groupName={group.group_name}
                    removeGroup={removeGroup}
                    sensors={group.sensors}
                    openModal={() => {
                      const g =
                        groupList?.find((g) => g.group_id === group.group_id) ||
                        null;
                      setDisplayedGroup(g);
                      setDisplayedGroupNameInput(g!.group_name);
                      setDisplayedGroupColorInput(g!.group_color);
                      setIsOpen(true);
                    }}
                    key={idx}
                  />
                );
              })}
          </tbody>
        </table>
      </div>
      <Modal
        isOpen={modalIsOpen}
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
                      value={displayedGroupNameInput}
                      onChange={(e) =>
                        setDisplayedGroupNameInput(e.target.value)
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Barva:</td>
                  <td>
                    <input
                      type="color"
                      value={displayedGroupColorInput}
                      onChange={(e) =>
                        setDisplayedGroupColorInput(e.target.value)
                      }
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
                    displayedGroupNameInput,
                    displayedGroupColorInput
                  );
                }
                setIsOpen(false);
                fetchGroupList();
              }}
            >
              Uložit
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Groups;
