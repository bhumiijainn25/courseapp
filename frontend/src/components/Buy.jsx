import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast';
import axios from 'axios';
import { BACKEND_URL } from '../utils/utils';

function Buy() {
  const { courseId } = useParams();

  const navigate = useNavigate();

  const [course, setCourse] = useState({});
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await axios.post(
          `${BACKEND_URL}/course/buy/${courseId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        setCourse(response.data.course);
        setOrder(response.data.order);
      } catch (error) {
        console.log(error);

        if (error.response?.status === 400) {
          toast.error("You have already purchased this course");
          navigate("/purchases");
        } else {
          setError(error.response?.data?.message || "Something went wrong");
        }
      }

      setLoading(false);
    };

    fetchOrder();
  }, [courseId]);

  const handlePurchase = () => {

    if (import.meta.env.VITE_DEMO_PAYMENT === "true") {

    axios.post(
        `${BACKEND_URL}/course/demo-buy/${courseId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        }
    )
    .then((response) => {

        toast.success(response.data.message);

        navigate("/purchases");

    })
    .catch((error) => {

        toast.error(error.response?.data?.message || "Purchase failed");

    });

    return;
}
    if (!order) {
      toast.error("Order not found");
      return;
    }
    console.log("Razorpay Key:", import.meta.env.VITE_RAZORPAY_KEY_ID);
    console.log("Order:", order);

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      amount: order.amount,

      currency: order.currency,

      name: "Course Haven",

      description: course.title,

      image: course.image?.url,

      order_id: order.id,

      prefill: {
        name: user?.user?.firstName || "",
        email: user?.user?.email || "",
      },

      theme: {
        color: "#4f46e5",
      },

      handler: async function () {
  try {

    const response = await axios.post(
      `${BACKEND_URL}/course/demo-purchase`,
      {
        courseId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    toast.success(response.data.message);

    navigate("/purchases");

  } catch (error) {

    console.log(error);

    toast.error(error.response?.data?.message || "Purchase Failed");

    }
  },
};

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", function (response) {
      console.log(response.error);

      toast.error("Payment Failed");
    });

    razorpay.open();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg">
          <p>{error}</p>

          <Link
            to="/courses"
            className="mt-4 block text-center bg-indigo-500 text-white py-2 rounded"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row my-32 container mx-auto">

      <div className="w-full md:w-1/2 p-6">

        <h1 className="text-2xl font-bold underline mb-6">
          Order Details
        </h1>

        <img
          src={course.image?.url}
          alt={course.title}
          className="rounded-lg h-56 object-cover w-full"
        />

        <h2 className="mt-5 text-xl font-semibold">
          {course.title}
        </h2>

        <p className="text-gray-600 mt-2">
          {course.description}
        </p>

        <p className="text-2xl font-bold text-green-600 mt-6">
          ₹{course.price}
        </p>

      </div>

      <div className="w-full md:w-1/2 flex justify-center items-center">

        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">

          <h2 className="text-xl font-bold mb-6">
            Complete Payment
          </h2>

          <button
            onClick={handlePurchase}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 duration-300"
          >
            Pay ₹{course.price}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Buy;