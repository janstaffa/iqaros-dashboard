import { BallTriangle } from 'react-loader-spinner';
import { Outlet } from 'react-router-dom';
import Nav from '../../Nav';

interface LoaderProps {
  loaderVisible: boolean;
}
const LayoutWithNav: React.FC<LoaderProps> = ({ loaderVisible }) => {
  return (
    <>
      <Nav />
      <main>
        {!loaderVisible && <Outlet />}

        <BallTriangle
          height={100}
          width={100}
          radius={5}
          color="#11547a"
          ariaLabel="Loading..."
          wrapperClass="loader"
          visible={loaderVisible}
        />
      </main>
    </>
  );
};

const LayoutWithoutNav: React.FC<LoaderProps> = ({ loaderVisible }) => {
  return (
    <main>
      {!loaderVisible && <Outlet />}

      <BallTriangle
        height={100}
        width={100}
        radius={5}
        color="#11547a"
        ariaLabel="Loading..."
        wrapperClass="loader"
        visible={loaderVisible}
      />
    </main>
  );
};

export { LayoutWithNav, LayoutWithoutNav };

