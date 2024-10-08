"use client";
import Link from 'next/link';
import useUserStore from "@/lib/useUserStore";
import useGameStore from "@/lib/useGameStore";
import styled from '@emotion/styled';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/lib/api";
import { useRouter } from 'next/navigation'; // 从 next/navigation 导入 useRouter


export default function Home() {
    const { user, setUser, logout } = useUserStore();  /* 用户状态 */
    const { setGame } = useGameStore();  /* 游戏状态 */
    const [rankingTitle, setRankingTitle] = useState("搜索结果");
    const [searchResults, setSearchResults] = useState([]); // 存储搜索结果
    const [isHydrated, setIsHydrated] = useState(false); // 确保客户端渲染完成
    const [loading, setLoading] = useState(false); // 搜索加载状态
    const [noResults, setNoResults] = useState(false); // 无搜索结果状态
    const router = useRouter(); // 使用 useRouter 钩子

    useEffect(() => {
        // 确保组件在客户端渲染
        setIsHydrated(true);
        // 检查 localStorage 中是否有用户数据
        const storedUserString = localStorage.getItem('user-storage');
        if (storedUserString) {
            const storedUser = JSON.parse(storedUserString);
            if (storedUser && storedUser.state && storedUser.state.user) {
                setUser(storedUser.state.user);
            }
        }
    }, [setUser]);

    // 将 SVG 内容嵌入 styled-component
    const BackgroundDiv = styled.div`
        background-image: url('/fengmian2.jpg');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
    `;

    const recommendedGames = [
        { image: '/fengmian1.jpg', name: '推荐游戏1' },
        { image: '/fengmian1.jpg', name: '推荐游戏2' },
        { image: '/fengmian1.jpg', name: '推荐游戏3' },
        { image: '/fengmian1.jpg', name: '推荐游戏4' },
        { image: '/fengmian1.jpg', name: '推荐游戏5' }
    ];

    // 处理搜索输入并发送请求
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNoResults(false);
        const formData = new FormData(e.target);  // e.target 指向触发事件的元素
        const { inputItem } = Object.fromEntries(formData)
        const { data: nameData, error: nameError } = await supabase
            .from('game')
            .select('*')
            .ilike('g_name', `%${inputItem}%`);

        const { data: styleData, error: styleError } = await supabase
            .from('game')
            .select('*')
            .ilike('style', `%${inputItem}%`);

        const { data: ratingData, error: ratingError } = await supabase
            .from('game')
            .select('g_id, avg_rating');

        if (nameError || styleError || ratingError) {
            console.error('Error fetching search results:', nameError, styleError, ratingError);
            setLoading(false);
            return;
        }

        const results = [...nameData, ...styleData]
            .filter((game, index, self) => index === self.findIndex((g) => g.g_id === game.g_id))
            .map((game) => {
                const rating = ratingData.find(r => r.g_id === game.g_id)?.avg_rating || 0;
                return { ...game, rating };
            });

        setSearchResults(results);
        setLoading(false);
        setNoResults(results.length === 0);
    };

    /* const handleInputChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []); */ // 空依赖数组意味着这个回调只会在组件挂载时创建一次

    const handleGameClick = (game) => {
        return () => {
            setLoading(true);
            setGame(game); // 将点击的游戏设置为全局游戏状态
            router.push('/dashboard/GameDetail'); // 使用 useRouter 进行导航，传递游戏 ID
            console.log('被点击了:', game); // 输出更新后的游戏对象
        };
    };

    if (!isHydrated) {
        // 避免客户端和服务端渲染结果不一致的问题
        return null;
    }

    const CenteredMessage = styled.div`
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        font-size: 1.5rem;
        color: white;
    `;

    return (
        <BackgroundDiv>
            <div className="text-x text-gray-900">
                {/* 导航栏 */}
                <nav className="flex items-center px-4 py-5 bg-gray-900 justify-between ">   {/* 导航栏 */}
                    <div className="text-white flex items-center space-x-4">
                        <div className='flex flex-row items-center pr-4'>
                            <a href="#">
                                <img src="/game new.svg" width="80" height="35" alt="Steam 主页链接"/>
                            </a>
                            <label htmlFor="#" className='text-2xl'>STREAM</label>
                        </div>

                        <ul className="flex items-center space-x-6">
                            <li>
                                <a href="/dashboard" className="hover:text-gray-400 text-white">商店</a>
                            </li>
                            <li>
                                <a href="/dashboard/favo" className="hover:text-gray-400 text-white">个人中心</a>
                            </li>
                            <li>
                                <a href="/dashboard/LeaderBoard" className="hover:text-gray-400 text-white">排行榜</a>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col justify-center space-y-2">
                        <label htmlFor="#" className="text-xl text-white px-2">{user?.name}</label>
                        <Link href="/login"
                              className="upgrade-btn active-nav-link text-white text-sm px-2 hover:text-blue-500 hover:underline"
                              onClick={() => logout()}>退出账户</Link>
                    </div>
                </nav>
            </div>

            <div className="container mx-auto my-10 flex-1 rounded items-center justify-center">
                <div className="text-x text-gray-900">
                    {/* 子导航栏 */}
                    <div className="flex items-center px-4 py-3 bg-gray-600 justify-between">
                        <ul className="flex items-center space-x-6">
                            <li>
                                <a href="/dashboard/StreamAI"
                                   className='flex items-center w-full hover:text-gray-400 text-white text-base leading-5'>
                                    <img src="/aislogo.png" width="40" height="40" alt="Steam 主页链接"
                                         className="mr-2"/>
                                    <span>STREAM AI</span>
                                </a>
                            </li>
                        </ul>
                        <div className="relative">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    className="rounded bg-white-900 border border-gray-600 placeholder-gray-400 w-60 px-3 py-1"
                                    placeholder="搜索"
                                    name='inputItem'
                                    /* onChange={handleInputChange} */
                                />
                                <button type="submit"
                                        className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center px-2">
                                    <img src="/search.png" className='w-5'/>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
                {/* 推荐和搜索结果 */}
                <div className="flex mt-10 items-center justify-center">
                    <main className="w-3/4 p-4 bg-gray-800 bg-opacity-80 text-white">
                        <div className="flex justify-between mb-4 px-4 items-center text-base font-normal">
                            <h2 className="text-xl flex-1">{rankingTitle}</h2>
                            <div className="w-1/6 text-right" style={{marginRight: '-2rem'}}>
                                <span>发售时间</span>
                            </div>
                            <div className="w-1/6 text-right" style={{marginRight: '0.5rem'}}>
                                <span>评分</span>
                            </div>
                        </div>
                        {loading ? (
                            <CenteredMessage>搜索中......</CenteredMessage>
                        ) : noResults ? (
                            <CenteredMessage>无搜索结果</CenteredMessage>
                        ) : (
                            <ul>
                                {searchResults.map((game, index) => (
                                    <li key={index}
                                        className="flex py-2 px-4 bg-gray-700 bg-opacity-80 rounded mb-2 hover:bg-gray-600 hover:bg-opacity-80 transition duration-300 cursor-pointer"
                                        onClick={handleGameClick(game)}> {/* 添加 onClick 事件 */}
                                        <img src={game.face_img} alt={game.g_name} className="w-40 h-20 object-cover mr-4"/> {/* 固定图片大小为长方形 */}
                                        <div className="flex-1 flex flex-col justify-center">
                                            <span className="text-xl font-bold mb-1">{game.g_name}</span>
                                            <div className="flex flex-wrap">
                                                {game.style && game.style.split('，').map((tag, tagIndex) => (
                                                    <span key={tagIndex}
                                                          className="text-sm text-gray-400 bg-gray-900 bg-opacity-50 rounded px-2 py-1 mr-2 mt-1">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-1/6 text-center flex items-center justify-center" style={{ marginRight: '-1rem' }}>
                                            <span>{new Date(game.g_time).toLocaleDateString()}</span>
                                        </div>
                                        <div className="w-1/6 text-right flex items-center justify-center" style={{ marginRight: '-3rem' }}>
                                            <span>{game.rating}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </main>
                </div>
            </div>
            {/* end container */}
        </BackgroundDiv>
    );
}
