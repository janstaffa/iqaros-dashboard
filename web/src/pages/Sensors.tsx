import { useContext, useEffect, useState } from 'react';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { DataContext } from '../App';
import SensorModal from '../components/Modals/SensorModal';
import SensorRow from '../components/SensorRow';
import { Sensor, Sort, SortHead, SortOptions } from '../types';

function Sensors() {
  const data = useContext(DataContext);

  const [sortedSensorList, setSortedSensorList] = useState<Sensor[] | null>(
    null
  );

  const sortHead: (SortHead | null)[] = [
    null,
    { columnName: 'ID', sortPath: 'sensor_id' },
    // { columnName: 'Síťové ID', sortPath: 'network_id' },
    { columnName: 'Název', sortPath: 'sensor_name' },
    {
      columnName: 'Teplota',
      sortPath: 'data.temperature.value',
    },
    {
      columnName: 'Relativní vlhkost',
      sortPath: 'data.humidity.value',
    },
    {
      columnName: 'Poslední záznam',
      sortPath: 'last_response',
    },
    {
      columnName: 'Síla signálu',
      sortPath: 'data.rssi.value',
    },
    null,
  ];
  const defaultSortOptions: SortOptions = {
    sortPath: sortHead[1]!.sortPath,
    sort: Sort.Ascending,
  };

  const [sortOptions, setSortOptions] =
    useState<SortOptions>(defaultSortOptions);

  useEffect(() => {
    const sorted = [...data.sensorList];

    if (sortOptions.sort !== Sort.None)
      sorted.sort((a, b) => {
        const path = sortOptions.sortPath.split('.');
        let valueA = a as any;
        let valueB = b as any;
        for (const p of path) {
          valueA = valueA[p];
          valueB = valueB[p];
        }

        const sortDirection = sortOptions.sort === Sort.Ascending ? 1 : -1;
        if (valueA < valueB) return -1 * sortDirection;
        else if (valueA > valueB) return 1 * sortDirection;
        return 0;
      });

    setSortedSensorList(sorted);
  }, [sortOptions, data]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [detailSensor, setDetailSensor] = useState<Sensor | null>(null);

  return (
    <>
      <div className="styled_table">
        <table>
          <thead>
            <tr>
              {sortHead.map((sh, i) => (
                <td
                  className={sh !== null ? 'sortable_column' : ''}
                  onClick={() => {
                    if (sh === null) return;
                    if (sortOptions.sortPath === sh.sortPath) {
                      let newSort = Sort.None;
                      if (sortOptions.sort === Sort.None)
                        newSort = Sort.Ascending;
                      if (sortOptions.sort === Sort.Ascending)
                        newSort = Sort.Descending;
                      if (sortOptions.sort === Sort.Descending)
                        newSort = Sort.None;

                      setSortOptions({ ...sortOptions, sort: newSort });
                    } else {
                      setSortOptions({
                        sortPath: sh.sortPath,
                        sort: Sort.Ascending,
                      });
                    }
                  }}
                  key={i}
                >
                  <div className='flex flex-row items-center'>
                    {sh?.columnName}
                    {sh !== null &&
                      (sortOptions.sortPath === sh.sortPath ? (
                        sortOptions.sort === Sort.Ascending ? (
                          <FaSortUp />
                        ) : sortOptions.sort === Sort.Descending ? (
                          <FaSortDown />
                        ) : (
                          <FaSort className="sort_hidden" />
                        )
                      ) : (
                        <FaSort className="sort_hidden" />
                      ))}
                  </div>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSensorList &&
              sortedSensorList.map((sensor, idx) => {
                return (
                  <SensorRow
                    key={idx}
                    sensor={sensor}
                    openModal={() => {
                      const s =
                        data.sensorList.find(
                          (s) => s.sensor_id === sensor.sensor_id
                        ) || null;
                      setDetailSensor(s);
                      setModalIsOpen(true);
                    }}
                  />
                );
              })}
          </tbody>
        </table>
      </div>
      {detailSensor && (
        <SensorModal
          isOpen={modalIsOpen}
          setIsOpen={setModalIsOpen}
          sensor={detailSensor}
        />
      )}
    </>
  );
}

export default Sensors;
