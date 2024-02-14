import { Link } from "react-router-dom";

export interface NotFoundProps {}

const NotFound: React.FC<NotFoundProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-5">
        <h1 className="w-full text-center text-9xl text-accent-normal">404</h1>
        <p className="text-2xl">Stránka nebyla nalezena</p>
      </div>
      <Link
        to="/"
        className="bg-accent-normal text-white rounded-full px-4 py-2 border-none hover:bg-accent-light"
      >
        Zpět
      </Link>
    </div>
  );
};

export default NotFound;
