import { useContext, useEffect, useState } from 'react';
import { MdAdd, MdSettings } from 'react-icons/md';
import { DataContext } from '../App';
import DashboardTile from '../components/DashboardTile';

import { toast } from 'react-toastify';
import DashboardModal from '../components/Modals/DashboardModal';
import { APP_API_BASE_PATH } from '../constants';
import { GenericApiResponse, Tile, TileListApiResponse } from '../types';

function Dashboard() {
  const data = useContext(DataContext);

  const [tileList, setTileList] = useState<Tile[]>([]);

  const fetchTileList = () => {
    fetch(APP_API_BASE_PATH + '/tilelist')
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
          }}
          title="Nová dlaždice"
        >
          <MdAdd />
        </button>
      </div>
      <div className="flex flex-row flex-wrap gap-2 p-8 overflow-y-auto justify-center">
        {tileList.map((t, idx) => (
          <DashboardTile
            tile={t}
            sensorData={data.latestSensorData}
            groupList={data.groupList}
            isEditing={isEditing}
            remove={() => removeTile(t.ID)}
            key={idx}
          />
        ))}
      </div>
      <DashboardModal
        isOpen={modalIsOpen}
        setIsOpen={setModalIsOpen}
        tileList={tileList}
        fetchTileList={fetchTileList}
      />
    </>
  );
}

export default Dashboard;
