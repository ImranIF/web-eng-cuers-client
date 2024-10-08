"use client";
import React from "react";
import {PanelLeftClose, PanelRightClose} from "lucide-react";
import {Button} from "@/components/ui/button";
import {usePathname, useRouter} from "next/navigation";
import {useSettingStore} from "@/store/SettingStore";
import {Nav} from "@/components/nav";

export default function SidebarLayout({children}: {
    children: React.ReactNode
}) {
    const router = useRouter();
    const pathname = usePathname();

    const {isSidebarOpen, setSidebarOpen, setLastRoute} = useSettingStore();
    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    }

    return (
        <div className="w-full h-full overflow-hidden">
            <div className="">
                <div
                    className={`absolute w-72 h-screen transform border-r transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} pt-2`}
                >
                    <Nav/>
                </div>
                <div
                    className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? "sm:pl-72 translate-x-70 sm:translate-x-0 sm:transform-none" : "sm:pl-0 translate-x-0"}`}>
                    <div
                        className="w-full border-b p-1 pr-2 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={``}
                            onClick={toggleSidebar}
                        >
                            {
                                isSidebarOpen ?
                                    <PanelLeftClose className="w-8 h-8"
                                                    strokeWidth={1}/> :
                                    <PanelRightClose
                                        className="w-8 h-8 "
                                        strokeWidth={1}></PanelRightClose>
                            }
                        </Button>
                    </div>
                    <div
                        className="overflow-hidden w-full flex justify-center min-h-screen">
                        <div
                            className={" w-full px-3 md:w-[800px] md:px-8" +
                                " lg:w-[1200px]" +
                                " flex " +
                                " justify-center overflow-y-scroll h-screen" +
                                " no-scrollbar"}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}