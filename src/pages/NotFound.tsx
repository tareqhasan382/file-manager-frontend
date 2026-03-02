import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="lg:px-28 px-2 py-10 w-full h-[400px] bg-white flex flex-col items-center justify-center ">
            <h1 className=" text-7xl font-extrabold ">404</h1>
            <p className=" uppercase text-center justify-center ">
                We are sorry,but the page you requested was not found.
            </p>
            <div className=" flex items-center gap-4 mt-5 ">
                <Link to="/">
                    <button className=" w-[120px] h-[40px] bg-black text-white rounded-full ">
                        Go Home
                    </button>
                </Link>
                <button className=" w-[120px] h-[40px] bg-black text-white rounded-full ">
                    Contract us
                </button>
            </div>
        </div>
    );
};

export default NotFound;