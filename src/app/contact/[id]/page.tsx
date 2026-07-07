"use client";

import { useParams, useRouter } from "next/navigation";

export default function Contact() {
    const router = useRouter()
    const param = useParams();
    console.log("====================>",param);
    const id= param.id as string;
    console.log("===============================>", id)
     return(
     <>
     <h1>This is id contact page $ Id {id} </h1>
     {/* <button className="ms-5 rounded-2xl p-2 bg-amber-500 text-amber-950"
     onClick={() => router.push(`/auth/signup/${id}`)}> Go to Home</button> */}
     </>
    )
}