"use client";

import { useRouter } from "next/navigation";

export default function About() {
    const router = useRouter();
    const myId = "03006766805"
    return (
        <>
        <h1>This is About page </h1>
        <button className="ms-5 rounded-2xl p-2 bg-amber-500 text-amber-950"
        onClick={() => router.push(`/contact/${myId}`)}>Go to Contact page with Id</button>
        </>
    )
}