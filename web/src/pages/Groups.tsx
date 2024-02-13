import { useContext, useEffect, useRef, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { toast } from 'react-toastify';
import { DataContext, FunctionContext } from '../App';
import GroupRow from '../components/GroupRow';
import GroupModal from '../components/Modals/GroupModal';
import { APP_API_BASE_PATH } from '../config';
import { GenericApiResponse, SensorGroup } from '../types';

function Groups() {
  const data = useContext(DataContext);
  const functions = useContext(FunctionContext);

  const [localGroupList, setLocalGroupList] = useState<SensorGroup[]>([]);
  const localGroupListRef = useRef(localGroupList);
  localGroupListRef.current = localGroupList;

  function createNewGroup() {
    fetch(APP_API_BASE_PATH + '/newgroup', {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
    })
      .then((data) => data.json())
      .then((response: GenericApiResponse) => {
        if (response.status === 'err') throw new Error(response.message);
        // Push it on top of the list
        setLocalGroupList([response['data'], ...localGroupListRef.current]);
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
      });
  }
  async function removeGroup(groupId: number) {
    const payload = {
      groupId,
    };
    return new Promise((res, rej) =>
      fetch(APP_API_BASE_PATH + '/removegroup', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      })
        .then((data) => data.json())
        .then((response: GenericApiResponse) => {
          if (response.status === 'err') throw new Error(response.message);
          res(null);
        })
        .catch((e: Error) => {
          console.error(e);
          toast.error(e.message);
          rej(e);
        })
    );
  }

  useEffect(() => {
    setLocalGroupList(data.groupList);
  }, [data]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [displayedGroup, setDisplayedGroup] = useState<SensorGroup | null>(
    null
  );

  return (
    <>
      <div className="floating_buttons">
        <button onClick={createNewGroup}>
          <MdAdd />
        </button>
      </div>
      {localGroupList.length > 0 ? (
        <div className="styled_table">
          <table className="w-full table-fixed">
            <colgroup>
              <col width="70px" />
              <col width="300px" />
              <col />
              <col width="100px" />
            </colgroup>
            <thead>
              <tr>
                <td>Barva</td>
                <td>Název</td>
                <td>Senzory</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {localGroupList.map((group, idx) => {
                return (
                  <GroupRow
                    group={group}
                    handleRemove={async () => {
                      const prompt = window.confirm(
                        `Opravdu si přejete smazat skupinu ${group.group_name}?`
                      );
                      if (!prompt) return;
                      await removeGroup(group.group_id);
                      functions.fetchGroupList();
                      functions.fetchSensorList();
                      toast.success(
                        `Skupina ${group.group_name} byla odstraněna`
                      );
                    }}
                    handleDetail={() => {
                      const g =
                        localGroupList.find(
                          (g) => g.group_id === group.group_id
                        ) || null;
                      setDisplayedGroup(g);
                      setModalIsOpen(true);
                    }}
                    key={idx}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center text-3xl">
          <span className="pt-20">
            Žádná skupina -{' '}
            <span className="link" onClick={createNewGroup}>
              přidat
            </span>
          </span>
        </div>
      )}
      {displayedGroup && (
        <GroupModal
          isOpen={modalIsOpen}
          setIsOpen={setModalIsOpen}
          displayedGroup={displayedGroup}
        />
      )}
    </>
  );
}

export default Groups;
