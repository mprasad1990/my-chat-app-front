import { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faBars, faPaperPlane, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import AlertContext from '../context/alert/AlertContext';
import { FiArrowLeft, FiMoreVertical } from 'react-icons/fi';
import EditMessageModal from './EditMessageModal';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Chat() {
  const [token] = useState(localStorage.getItem('token') || '');
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [userDetails, setUserDetails] = useState({});
  const [users, setUsers] = useState([]);
  const [receiverKey, setReceiverKey] = useState('');
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const chatBoxRef = useRef();
  const chatInputRef = useRef();
  const navigate = useNavigate();
  const [typingUser, setTypingUser] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentChatRequestData, setCurrentChatRequestData] = useState('');
  const alertContext  = useContext(AlertContext);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const emojiBoxRef = useRef(null);
  const emojis = ['😊', '😂', '😍', '😎', '👍', '😢', '😡', '❤️', '🔥', '🎉'];
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replyToMessageId, setReplyToMessageId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  //State for Edit Message Modal
  const [isEditOpen, setEditOpen] = useState(false);
  const [editMsgId, setEditMsgId] = useState(null);
  const [editText, setEditText]   = useState("");

  useEffect(() => {
    if (!token) return;
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/users`, 
        {
          headers: { Authorization: `Bearer ${token}` }   
        }
      )
      .then(res => {
        setUsers(res.data);
        if (!receiverKey) { 
          const firstOtherUser = res.data.find(u => u.account_key !== user?.account_key);
          //setReceiverKey(firstOtherUser?.account_key || '');
          handleUserClick(firstOtherUser?.account_key || '');
        }
      });

    socket.on('receive_message', (data) => {
      if (
        (data.sender_key === user.account_key && data.receiver_key === receiverKey) ||
        (data.sender_key === receiverKey && data.receiver_key === user.account_key)
      ) {
        setChat(prev => [...prev, data]);
        if(data.receiver_key === user.account_key){
          if(data.sender_key === receiverKey){
            markMessagesAsRead(data.sender_key);
          }
          else{
            //reload Users with Unread Messsage
            fetchAllChatUsers();
          }
        }
      }
      else{
        fetchAllChatUsers();
      }

      // take sidebar user to top with latest message
      const updatedUsers = users.map(u => {
        if (u.account_key === data.sender_key || u.account_key === data.receiver_key) {
          return { ...u, last_message: data.message, last_message_timestamp: new Date() };
        }
        return u;
      }).sort((a, b) => {
        return new Date(b.last_message_timestamp || 0) - new Date(a.last_message_timestamp || 0);
      });
      //console.log('Updated Users:', updatedUsers);
      setUsers(updatedUsers);
    });

    return () => socket.off('receive_message');
  }, [user, token, receiverKey]);

  useEffect(() => {
    if (receiverKey && token) {
      axios.get(`${import.meta.env.VITE_BACKEND_URL}/messages/${receiverKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setChat(res.data);
        markMessagesAsRead(receiverKey);
      });
    }
  }, [receiverKey, token]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo(0, chatBoxRef.current.scrollHeight);
  }, [chat]);

  useEffect(() => {
    socket.on('typing', (data) => { console.log('Typing: ', data);
      if (data.receiver_key === user.account_key && data.sender_key === receiverKey) {
        setTypingUser(data.sender_name);
        setTimeout(() => setTypingUser(''), 3000);
      }
    });
    return () => socket.off('typing');
  }, [user, receiverKey]);

  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const data = {
      sender_key: user.account_key,
      receiver_key: receiverKey,
      message: trimmed,
      reply_to_message_id: replyToMessageId,
      reply_to_message: replyToMessage
    };

    socket.emit('send_message', data);
    setMessage('');
    setReplyToMessage(null);
    setReplyToMessageId(null);
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', {
      sender_key: user.account_key,
      receiver_key: receiverKey,
      sender_name: user.full_name
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const handleUserClick = async (key) => {
    
    if(key){
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/get-chat-request-data`,
        { sender_key: user.account_key, receiver_key: key },  
        { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setCurrentChatRequestData(res.data);
        setReceiverKey(key);
        //setChat([]);
        setSidebarOpen(false); // close sidebar on mobile after selecting user
      })
      .catch(err => {
        console.error('Failed to fetch chat request status:', err);
        alertContext.setAlertMessage({ show:true, type: 'error', message: 'Failed to fetch chat request status!' });
      });
    }
    else{
      setCurrentChatRequestData([]);
      setReceiverKey('');
      //setChat([]);
      setSidebarOpen(false); // close sidebar on mobile after selecting user
    }

  };

  const redirectTo = (path) => {
    navigate(`/${path}`); 
    setSidebarOpen(false); // close sidebar on mobile after redirect
  };

  if (!user || !token) return <div>Please login first.</div>;

  useEffect(() => {

    const fetchUserProfile = async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/fetch-profile`, 
          { account_key: user.account_key },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserDetails(res.data);
      } 
      catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUserProfile();

  }, [user]);

  const updateChatRequestStatus = async (status) => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/update-chat-request-status`,
      { sender_key: currentChatRequestData.sender_key, receiver_key: currentChatRequestData.receiver_key, status },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => {
      setCurrentChatRequestData(res.data);
      alertContext.setAlertMessage({ show:true, type: 'success', message: `Chat request ${status}!` });

      socket.emit('chat_request_status_updated', {
        sender_key: currentChatRequestData.sender_key,
        receiver_key: currentChatRequestData.receiver_key,
        status
      });

      if (status === 'accepted') {
        handleUserClick(currentChatRequestData.sender_key);
        setChat([]); // Clear chat when accepting a new request
      } 
      else {
        //set first user in sidebar as active
        const firstOtherUser = users.find(u => u.account_key !== user.account_key);
        let receiverKey = firstOtherUser?.account_key || '';

        // Show alert for chat request rejection
        if(receiverKey !== '') {
          handleUserClick(receiverKey);
        } 
        else {
          setReceiverKey(''); // Reset receiver key on rejection
          setChat([]); // Clear chat on rejection
        }
      }
    })
    .catch(err => {
      console.error(`Failed to update chat request status to ${status}:`, err);
      alertContext.setAlertMessage({ show:true, type: 'error', message: `Failed to update chat request status to ${status}!` });
    });
  } 

  useEffect(() => {
    
    socket.on('chat_request_update', ({ sender_key, receiver_key, status, receiver_full_name }) => { 
      if (sender_key === user.account_key && receiver_key === receiverKey) {
        setCurrentChatRequestData(prev => ({
          ...prev,
          status,
          sender_key,
          receiver_key
        }));

        if (status === 'accepted') {
          setReceiverKey(receiver_key);
          setChat([]); // Clear chat when accepting a new request
        } 
        else {
          console.log(`Chat request from ${receiver_full_name} was rejected.`);
          const firstOtherUser = users.find(u => u.account_key !== user.account_key);
          let receiverKey = firstOtherUser?.account_key || '';
          if (receiverKey) {
            handleUserClick(receiverKey);
          } 
          else {
            setReceiverKey(''); // Reset receiver key on rejection
            setChat([]); // Clear chat on rejection
          }
        }
        // Show alert for chat request update
        alertContext.setAlertMessage({ show:true, type: 'success', message: `Chat request ${status} by ${receiver_full_name}` });
      }
    });

    return () => {
      socket.off('chat_request_update');
    };
    
  }, [receiverKey]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.length > 1) {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/search-users-autocomplete`, 
          { searchTerm: searchTerm },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(
          res => setSuggestions(res.data)
        )
        .catch(err => console.error(err));
      } 
      else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  /* Send chat request */
  const sendChatRequest = async (receiver_key, full_name) => {
    axios.post(`${import.meta.env.VITE_BACKEND_URL}/send-chat-request`, 
      { receiver_key },
      { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      setSuggestions([]);
      setSearchTerm('');
      if(res.data.success){
        alertContext.setAlertMessage({ show:true, type: 'success', message: `Request sent to ${full_name}` });
        handleUserClick(receiver_key);
        //HERE we will have to emit socket event to notify receiver that he has a chat request to accept
        setCurrentChatRequestData(prev => ({
          ...prev,
          status: 'pending',
          sender_key: user.account_key,
          receiver_key
        }));
        socket.emit('chat_request_sent', {
          sender_key: user.account_key,
          receiver_key,
          status: 'pending'
        });
      }
      else{
        alertContext.setAlertMessage({ show:true, type: 'success', message: `Request sending failed!` });
      }
      
    });
  }

  const fetchAllChatUsers = () => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/users`, 
      {
        headers: { Authorization: `Bearer ${token}` }   
      }
    )
    .then(res => {
      setUsers(res.data);
    });
  }

  useEffect(() => {
    
    socket.on('chat_request_received', ({ sender_key, receiver_key, status, sender_full_name }) => { 
      if (receiver_key === user.account_key) {
        if(receiverKey){
          fetchAllChatUsers();
        }
        else{
          handleUserClick(sender_key);
        }
        // Show alert for chat request update
        alertContext.setAlertMessage({ show:true, type: 'success', message: `Chat request received from ${sender_full_name}` });
      }
    });

    return () => {
      socket.off('chat_request_received');
    };
    
  }, [receiverKey]);

  const markMessagesAsRead = async (chat_user_key) => {
    axios.post(`${import.meta.env.VITE_BACKEND_URL}/mark-as-read`,
      { sender_key: chat_user_key },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => {
      if(res.data.success){
        fetchAllChatUsers();
      }
    })
  }

  const handleClickOutside = (e) => {
    if (emojiBoxRef.current && !emojiBoxRef.current.contains(e.target)) {
      setShowEmojis(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
  };


  // Close on outside click
  useEffect(() => {
    const handleContextMenuClickOutside = () => {
      setMenuOpenId(null);
    };
    document.addEventListener('click', handleContextMenuClickOutside);
    return () => document.removeEventListener('click', handleContextMenuClickOutside);
  }, []);

  const handleMenuToggle = (e, idx) => {
    e.stopPropagation(); // prevent bubbling to document click
    setMenuOpenId(prev => (prev === idx ? null : idx));
  };

  //function for editing message
  const openEditModal = (messageId, currentMessage) => {
    setEditMsgId(messageId);
    setEditText(currentMessage);
    setEditOpen(true);
  }

  const handleSaveEdit = (newMessage) => {
    socket.emit("edit_message", {
      message_id: editMsgId,
      new_message: newMessage
    });
    setEditOpen(false);
  };

  useEffect(() => {
    socket.on('message_edited', ({ message_id, new_message, edited_at }) => { 
      setChat((prev) =>
        prev.map((msg) =>
          msg.id === message_id
            ? { ...msg, message: new_message, edited_at }
            : msg
        )
      );
    });

    return () => {
      socket.off('message_edited');
    };
  }, []);

  const handleReplyClick = (message_id, message) => {
    setReplyToMessageId(message_id);
    setReplyToMessage(message);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const closeReplyToMessage = () => {
    setReplyToMessage(null);
    setReplyToMessageId(null);
  };

  const openDeleteModal = (message_id) => {
    setMessageToDelete(message_id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!messageToDelete) return;

    // 🔹 Emit socket event to delete message
    socket.emit("delete_message", { message_id: messageToDelete, sender_key: user.account_key });

    // Close modal
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  useEffect(() => {
    socket.on('message_deleted', ({ message_id, sender_key }) => {
      setChat((prev) => prev.filter((msg) => msg.id !== message_id));
      //alertContext.setAlertMessage({ show:true, type: 'success', message: 'Message deleted successfully!' });
    });

    return () => {
      socket.off('message_deleted');
    };
  }, []);

  return (
    <div className="chat-app-container">
      {/* Search bar for search user auto complete and send chat request */}
      {showSearch && (
        <>
          <div className="global-search-bar">
            <div className="search-bar-inner">
              <button className="back-btn" onClick={() => setShowSearch(false)}>
                <FiArrowLeft size={20} />
              </button>
              <input
                type="text"
                className="search-input"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            {suggestions.length > 0 && (
              <ul className="suggestion-list">
                {suggestions.map(user => (
                  <li key={user.account_key}>
                    <span>{user.full_name} ({user.username})</span>
                    <button className='send-request-btn' onClick={() => sendChatRequest(user.account_key, user.full_name)}>Send Request</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Sidebar */}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-group" style={{ position: 'relative' }}>
            {
              userDetails.profile_image_type === 'avatar' ? (<img src={`/images/avatar-${userDetails.avatar}.jpg`} className="round-image" alt='Profile Image' style={{'marginRight':'12px'}} />) : ''
            }
            {
              userDetails.profile_image_type === 'profile_image' && userDetails.profile_image ? (
                <img src={userDetails.shared_image} className="round-image" alt='Profile Image' style={{'marginRight':'12px'}} />
              ) : ''
            }
            {
              userDetails.profile_image_type === 'profile_image' && userDetails.profile_image === '' ? (
                <img src={`/images/avatar-${userDetails.avatar}.jpg`} className="round-image" alt='Profile Image' style={{'marginRight':'12px'}} />
              ) : ''
            }
            {
              userDetails.profile_image_type === 'disabled' ? (
                <span className="user-avatar">{userDetails.full_name[0]}</span>
              ) : ''
            }
            <span className="sidebar-title">{user.full_name}</span>
            <FontAwesomeIcon
              icon={faEllipsisV}
              className="sidebar-menu-icon"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ marginLeft: 10, cursor: 'pointer', fontSize: '1.2em' }}
            />
            {menuOpen && (
              <div className="sidebar-menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <div className="sidebar-menu-item" onClick={() => { redirectTo('update-profile'); /* handle edit profile */ }}>
                  Edit Profile
                </div>
                <div className="sidebar-menu-item" onClick={() => { redirectTo('update-avatar'); /* handle edit avatar */ }}>
                  Edit Avatar
                </div>
              </div>
            )}
          </div>
          <FontAwesomeIcon
            icon={faSignOutAlt}
            className="logout-icon"
            title="Logout"
            style={{ cursor: 'pointer', marginLeft: 8, color: '#d00', fontSize: '1.2em' }}
            onClick={handleLogout}
          />
        </div>
        <div className="users-list">
          {users.filter(u => u.account_key !== user.account_key).map(u => (
            <div
              key={u.account_key}
              className={`user-list-item ${receiverKey === u.account_key ? 'active' : ''}`}
              onClick={() => handleUserClick(u.account_key)}
            >

              {
                u.profile_image_type === 'avatar' ? (<img src={`/images/avatar-${u.avatar}.jpg`} className="round-image" alt='Profile Image' style={{'marginRight':'12px'}} />) : ''
              }
              {
                u.profile_image_type === 'profile_image' && u.profile_image ? (
                  <img src={u.shared_image} className="round-image" alt='Profile Image' style={{'marginRight':'12px'}} />
                ) : ''
              }
              {
                u.profile_image_type === 'profile_image' && u.profile_image === '' ? (
                  <img src={`/images/avatar-${u.avatar}.jpg`} className="round-image" alt='Profile Image' style={{'marginRight':'12px'}} />
                ) : ''
              }
              {
                u.profile_image_type === 'disabled' ? (
                  <span className="user-avatar">{u.full_name[0]}</span>
                ) : ''
              }

              <span>
                <span className="user-fullname">{u.full_name}</span>
                <span className="user-username">{u.username}</span>
                {u.unread_count > 0 && (
                  <span className="unread-badge">{u.unread_count}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Overlay for closing sidebar */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      {/* Chat Main */}
      <div className="chat-main">
        <div className="chat-header">
          {/* Hamburger icon for mobile */}
          <FontAwesomeIcon
            icon={faBars}
            className="hamburger-icon"
            onClick={() => setSidebarOpen(true)}
            style={{ marginRight: 16 }}
          />
          <h2>
            {users.find(u => u.account_key === receiverKey)?.full_name || 'Select a user'}
          </h2>
        </div>
        <div className="chat-box" ref={chatBoxRef}>
          {
            (currentChatRequestData.status === 'accepted') && (
              <>
                {chat.map((msg, idx) => (
                  <div key={idx} className={`chat-message-wrapper ${msg.sender_key === user.account_key ? 'me' : 'other'}`}>
                    <div className="chat-message-inner">
                      <div className={`chat-message`}>
                        {msg.reply_to_message_id && (
                          <div className="quoted-message">
                            <span className="quoted-text">{msg.reply_to_message}</span>
                          </div>
                        )}
                        <span>{msg.message}</span>
                        <small className="message-timestamp">
                          {
                            (msg.edited_at) && new Date(msg.edited_at).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })
                          }
                          {
                            (!msg.edited_at) && new Date(msg.timestamp).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })
                          }
                        </small>
                      </div>
                      {/* 3 Dot Menu */}
                      <div className="three-dot-menu-container">
                        <div
                          className="menu-trigger"
                          onClick={(e) => handleMenuToggle(e, idx)}
                        >
                          &#8942;
                        </div>
                        {menuOpenId === idx && (
                          <ul className="mobile-context-menu">
                            <li onClick={(e) => handleReplyClick(msg.id, msg.message)}>Reply</li>
                            {(msg.sender_key === user.account_key) && (
                              <>
                                <li onClick={(e) => openEditModal(msg.id, msg.message)}>Edit</li>
                                <li onClick={(e) => openDeleteModal(msg.id)}>Delete</li>
                              </>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {typingUser && (
                  <div className="typing-indicator">
                    {typingUser} is typing...
                  </div>
                )}

                <EditMessageModal
                  isOpen={isEditOpen}
                  onClose={() => setEditOpen(false)}
                  onSave={handleSaveEdit}
                  initialText={editText}
                />

                {deleteModalOpen && (
                  <div className="delete-modal-overlay">
                    <div className="delete-modal">
                      <h3>Delete Message</h3>
                      <p>Are you sure you want to delete this message?</p>
                      <div className="delete-modal-actions">
                        <button className="back-btn" onClick={cancelDelete}>Cancel</button>
                        <button className="update-btn" onClick={confirmDelete}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
                
              </>
            )
          }

          {
            (currentChatRequestData.status === 'pending') && (
              <>
                {user.account_key === currentChatRequestData.sender_key ? (
                  <div className="row">
                    <div className="col-12 text-center">
                      <h2>
                        {users.find(u => u.account_key === currentChatRequestData.receiver_key)?.full_name || 'User'} has not accepted your chat request yet.
                      </h2> 
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-12 text-center">
                      <h2>
                        You have not accepted the chat request from {users.find(u => u.account_key === currentChatRequestData.sender_key)?.full_name || 'User'} yet.
                      </h2>
                      <div className="chat-request-actions">
                        <button className="accept-btn" onClick={() => updateChatRequestStatus('accepted')}>
                          Accept Chat Request
                        </button>
                        <button className="reject-btn" onClick={() => updateChatRequestStatus('rejected')}>
                          Reject Chat Request
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          }
        </div>
        {currentChatRequestData.status === 'accepted' && 
          <>
            {replyToMessage && (
              <div className="reply-preview">
                <span className="reply-label">Replying to:</span>
                <span className="reply-message">{replyToMessage}</span>
                <button onClick={closeReplyToMessage}>×</button>
              </div>
            )}

            <div className="chat-input">
              <div className="emoji-picker-wrapper" ref={emojiBoxRef}>
                <button className="emoji-toggle-btn" onClick={() => setShowEmojis(!showEmojis)}>
                  😊
                </button>
                {showEmojis && (
                  <div className="emoji-picker">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        className="emoji-item"
                        onClick={() => addEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea
                value={message}
                onChange={handleInputChange}
                placeholder="Type a message..."
                ref={chatInputRef}
              />
              <button className="send-btn" onClick={sendMessage}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </>
          
        }
      </div>
    </div>
  );
}