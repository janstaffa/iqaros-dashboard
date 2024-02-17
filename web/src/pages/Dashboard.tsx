import { useContext, useEffect, useState } from 'react';
import { MdAdd, MdSettings } from 'react-icons/md';
import { DataContext } from '../App';
import DashboardTile from '../components/DashboardTile';

import { toast } from 'react-toastify';
import DashboardModal from '../components/Modals/DashboardModal';
import { APP_API_BASE_PATH } from '../config';
import { GenericApiResponse, Tile, TileListApiResponse } from '../types';

function Dashboard() {
  const data = useContext(DataContext);

  const [tileList, setTileList] = useState<Tile[]>([]);

  const fetchTileList = () => {
    fetch(APP_API_BASE_PATH + '/tilelist', { credentials: 'include' })
      .then((data) => data.json())
      .then((parsed_data) => {
        const response = parsed_data as TileListApiResponse;
        if (response.status === 'err') throw new Error(response.message);

        setTileList(response.data);
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
      });
  };

  useEffect(() => {
    fetchTileList();
  }, []);

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
      credentials: 'include',
    })
      .then((data) => data.json())
      .then((response: GenericApiResponse) => {
        if (response.status === 'err') throw new Error(response.message);

        fetchTileList();
        toast.success('Dlaždice byla odstraněna');
      })
      .catch((e: Error) => {
        console.error(e);
        toast.error(e.message);
      });
  }

  const [isEditing, setIsEditing] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editedTile, setEditedTile] = useState<Tile | null>(null);

  return (
    <>
      <div className="floating_buttons">
        {tileList.length > 0 && (
          <button
            onClick={() => {
              setIsEditing(!isEditing);
            }}
          >
            <MdSettings />
          </button>
        )}
        <button
          onClick={() => {
            setEditedTile(null);
            setModalIsOpen(true);
          }}
          title="Nová dlaždice"
        >
          <MdAdd />
        </button>
      </div>
      {tileList.length > 0 ? (
        <div className="flex flex-row flex-wrap gap-2 p-8 overflow-y-auto justify-center">
          {tileList.map((t, idx) => (
            <DashboardTile
              tile={t}
              sensorData={data.latestSensorData}
              groupList={data.groupList}
              isEditing={isEditing}
              handleRemove={() => removeTile(t.ID)}
              handleEdit={() => {
                setEditedTile(t);
                setModalIsOpen(true);
              }}
              key={idx}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center text-3xl">
          <span className="pt-20">
            Žádné dlaždice -{' '}
            <span
              className="link"
              onClick={() => {
                setEditedTile(null);
                setModalIsOpen(true);
              }}
            >
              přidat
            </span>
          </span>
        </div>
      )}
      <DashboardModal
        isOpen={modalIsOpen}
        setIsOpen={setModalIsOpen}
        tileList={tileList}
        fetchTileList={fetchTileList}
        editedTile={editedTile}
      />
    </>
  );
}

export default Dashboard;
