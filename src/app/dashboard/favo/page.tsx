'use client'
import React, { useState, useEffect, CSSProperties, useRef } from 'react';
import useUserStore from "@/lib/useUserStore";
import useGameStore from "@/lib/useGameStore";
import { supabase } from "@/lib/api";
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/navigation'
import styled from '@emotion/styled';
import Image from 'next/image';
import Carousel from '@/components/carousel/Carousel';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 背景
const BackgroundDiv = styled.div`
  background-image: url('/fengmian2.jpg');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center; /* Center the form container */
  padding: 2rem;
  position: relative;
  margin: 0;
  background-attachment: fixed;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 3, 15, 0.09); /* 半透明黑色覆盖层 */
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

// 半透明框父容器
const CenteredContainer = styled.div`
  display: flex; /* 使用Flexbox布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 22vh; /* 调整白色半透明容器之间的距离(宽度比例) */
  margin-bottom: -2rem;
`;

// 黑色半透明框（链接版）
const FormContainer = styled.a`
  background: rgba(0, 0, 0, 0.70);
  padding: 2rem;
  border-radius: 25px;
  border: 2px solid #000;
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.55);
  display: flex; /* 修改为flex布局 */
  flex-direction: column; /* 子元素垂直排列 */
  justify-content: center; /* 子元素在容器中垂直居中 */
  align-items: flex-start; /* 子元素在容器中水平居左 */
  box-sizing: border-box; /* Include padding and border in the element's total width and height */
  height: 76%; /* This might need to be adjusted based on the parent container's height */
  width: 92%; /* Adjust to the desired width */
  max-height: 200px; /* Adjust to the desired max height */
  max-width: 6000px; /* Adjust to the desired max width */
  animation: slideUp 0.6s ease-out forwards;
  margin-bottom: 2rem;  /*useless?*/
  transition: transform 0.3s ease; /*smoothness of clicking*/
  color: hsl(0, 0%, 75%);

  &:last-child {
    margin-bottom: 0;
  }     

  &:hover {
    background: rgba(50, 30, 50, 0.80);  
    transform: scale(1.02);
    color: white;
  }
`;

// 调整FormContainer内的子元素
const FlexContainer = styled.div`
  display: flex; /* 使用Flexbox布局 */
  flex-direction: column; /* 子元素垂直排列 */
  justify-content: center; /* 子元素在容器中垂直居中 */
  gap: 1rem; /* 子元素之间的间距 */
  transform: translateY(-2px); /*半透明容器内部元素相对容器的垂直偏移*/
  width: 100%; // 宽度填满父容器
  height: 100%; // 高度填满父容器
`;

const SearchContainer = styled.a`
    display: flex;
    flex-direction: row;
    align-items: center;
    color: white; /* 设置搜索文字的颜色为白色 */
    // text-base;
    line-height: 1.25;
    background: rgba(192, 192, 192, 0.5); /* 灰色虚化背景，可以亮一点 */
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem; /* 圆角 */
    transition: background 0.3s ease; /* 过渡效果 */
    &:hover {
        background: rgba(192, 192, 192, 0.8); /* 悬停时变亮 */
    }
`;

// 按钮设置
const ImageButton = ({ imageUrl, onClick }) => {
  return (
    <button onClick={onClick} style={{
      border: 'none',
      background: 'none',
      position: 'relative', // 设置相对定位
      top: '7px', // 假设红框的顶部距离是50px
      right: '0',
      cursor: 'ns-resize' // 确保鼠标悬停时显示为指针
    }}>
      <img src="/butt.png" alt="Image Button" style={{ width: '25px', height: '40px' }} />
    </button>
  );
};

// 灰色实线(竖线)
const LineComponent = () => {
  const lineStyle = {
    width: '3px', // 线条宽度
    height: '80px', // 线条长度
    backgroundColor: '#A9A9A9', // 深灰色
    margin: '0 10px', // 调整为左右外边距
    display: 'inline-block', // 确保div以行内块元素显示
  };

  return <div style={lineStyle} />;
};

// 标号
const Label = ({ text, style }) => {
  return (
    <div className="label" style={style}>
      {text}
    </div>
  );
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const DraggableContainer = ({ id, index, moveContainer, children }) => {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: 'container',
    hover(item: DragItem) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveContainer(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'container',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

const CustomElement: React.FC = () => {
  const { user, logout, setUser } = useUserStore();   /* 用户状态 */
  const { game, setGame, exit } = useGameStore();  /* 游戏状态 */
  // 定义用户信息
  const userInfo = {
    id: user?.u_id,
    name: user?.name,
    password: user?.password // 加密后的密码
  };
  const [isHydrated, setIsHydrated] = useState(false); // 用于确保客户端渲染和服务端渲染一致
  const [games, setGames] = useState([]); // 存储游戏数据
  const router = useRouter();
  // 从 Supabase 获取游戏数据
  const fetchGames = async () => {
    try {
      // 首先查询是否存在该用户的收藏记录
      const { data: existing, error: queryError } = await supabase
        .from("collections")
        .select('g_ids')
        .eq('u_id', user.u_id)

      if (queryError) {
        console.error('Error querying existing data:', queryError);
        return;
      } 
      // 如果不存在收藏记录则 return
      else if (existing && existing.length === 0) {
        return
      }
      // 如果存在则查看收藏是否为空
      else if (existing && existing.length > 0) {
        const temp = existing[0].g_ids
        // 如果为空则 return
        if (temp.length === 0) {
          return
        }
        // 如果不为空则加载游戏
        else if (temp.length > 0){
          const array = temp.split('---').filter(Boolean)      // 使用 Boolean 来过滤掉空字符串
          // 使用 Promise.all 等待所有游戏数据查询的完成。这确保了所有游戏数据都被获取之后再更新状态，而且按照 array 中出现的顺序。
          const gamePromises = array.map(gameId =>
            supabase
              .from("game")
              .select("*")
              .eq("g_id", parseInt(gameId, 10))
              .single() 
          );
          const gamesResults = await Promise.all(gamePromises);
          const gamesData = gamesResults.map(result => result.data).filter(Boolean);   
          setGames(gamesData); 
        }
      }

    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleClickForm = (game) => {
    return () => {
        setTimeout(() => {
            setGame(game); // 更新游戏状态
            router.push('/dashboard/GameDetail'); // 跳转到详细页面
        }, 300); // 给予300毫秒的延迟确保加载覆盖层显示
    };
};

  useEffect(() => {
    fetchGames()
  }, [])

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

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  const moveContainer = async (dragIndex, hoverIndex) => {
    // 克隆当前游戏数组来避免直接修改状态
    const newGamesArray = [...games];
    // 从数组中移除被拖动的项目
    const [removed] = newGamesArray.splice(dragIndex, 1);
    // 在新位置重新插入被移除的项目
    newGamesArray.splice(hoverIndex, 0, removed);
    // 更新游戏状态
    setGames(newGamesArray);

    // 更新数据库中的顺序
    const newOrder = newGamesArray.map(game => game.g_id).join('---');  //read：g_id -> list -> str -->> db updating

    try {
      const { data, error } = await supabase
        .from('collections')
        .update({ g_ids: newOrder + '---'})
        .eq('u_id', user.u_id);

      if (error) {
        console.error('Error updating order:', error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  if (!isHydrated) {
    // 避免客户端和服务端渲染结果不一致的问题
    return null;
  }

  return (
    <DndProvider backend={HTML5Backend}>
    <BackgroundDiv style={{ margin: 0, padding: 0 }}>
        <div className="text-x text-gray-900 w-full">
            {/* 导航栏 */}
            <nav className="flex items-center px-4 py-5 bg-gray-900 justify-between w-full">
                <div className="text-white flex items-center space-x-4">
                    <div className='flex flex-row items-center pr-4'>
                        <a href="#">
                            <img src="/game new.svg" width="80" height="35" alt="Steam 主页链接" />
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
                    <Link href="/login" className="upgrade-btn active-nav-link text-white text-sm px-2 hover:text-blue-500 hover:underline" onClick={() => logout()}>退出账户</Link>
                </div>
            </nav>
        </div>
        <div className="container mx-auto my-10 flex-1 rounded items-center justify-center text-lg font-bold">
          <div className="text-x text-gray-900">
            {/* 子导航栏 */}
              <div className="flex items-center px-4 py-3 bg-gray-600 justify-between text-white">
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

                <div className="relative flex items-center">
                  <SearchContainer href="/dashboard/Search">
                    <span>搜索</span>
                      <img src="/search.png" className="w-5 ml-2"/>
                  </SearchContainer>
                </div>
              </div>
            </div>
        </div>


        <div className="container mx-auto my-10 flex-1 flex flex-row rounded items-start justify-between w-full" style={{ marginTop: '-20px' }}>
            {/* 个人信息部分 */}
            <aside className="w-full md:w-1/5 p-4 bg-gray-700 text-white overflow-y-auto mr-3" style={{ position: 'sticky', top: 25}}>
                <h2 className="text-3xl font-bold mb-6">用户信息</h2>
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2">用户ID:</label>
                    <p className="text-gray-200">{userInfo.id}</p>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2">用户名:</label>
                    <p className="text-gray-200">{userInfo.name}</p>
                </div>
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm font-bold mb-2">密码:</label>
                    <div className="flex items-center">
                        <p className="text-gray-200 mr-2">{showPassword ? userInfo.password : '********'}</p>
                        <button onClick={togglePasswordVisibility} className="bg-blue-500 text-white px-2 py-1 rounded">
                            {showPassword ? '隐藏' : '显示'}
                        </button>
                    </div>
                </div>
            </aside>

            {/* 收藏信息部分 */}
            <main className="flex-1">
                {games.map((game, index) => (
                    <DraggableContainer key={game.g_id} id={game.g_id} index={index} moveContainer={moveContainer}>
                        <CenteredContainer>
                            <FormContainer onClick={handleClickForm(game)} className='hover:cursor-pointer'>
                                <FlexContainer>
                                    <div className="flex flex-col md:flex-row items-center">
                                        <div className="mr-2">
                                            <Label text={index + 1} style={{ margin: '0 10px 0 0' }} />
                                        </div>
                                        <div className="mr-7">
                                            <img src={game.face_img} alt="Image" className="w-40 md:w-64 h-24" />
                                        </div>
                                        <div className='mr-6'>
                                            <LineComponent />
                                        </div>
                                        <div className="flex-1">
                                            <h2>{game?.g_name}</h2>
                                            <div className="tags">
                                                <span>{game?.style}</span>
                                            </div>
                                            <div className="info">
                                                <div className="release-date">
                                                    <span>发行日期：</span>
                                                    <span>{game.g_time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <ImageButton imageUrl={"/my-image.png"} onClick={CustomElement} />
                                        </div>
                                    </div>
                                </FlexContainer>
                            </FormContainer>
                        </CenteredContainer>
                    </DraggableContainer>
                ))}
            </main>
        </div>
    </BackgroundDiv>
</DndProvider>

);
};

/* 主界面 */
export default function Home() {
  return (<CustomElement></CustomElement>)
};