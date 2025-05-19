// components/NotificationBell.js
import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Badge, Popover, List, Typography, Divider, Button, Switch } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    notificationsEnabled, 
    toggleNotifications 
  } = useNotifications();
  const [visible, setVisible] = useState(false);

  const handleVisibleChange = (visible) => {
    setVisible(visible);
  };

  const content = (
    <div style={{ width: 300 }}>
      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Notifications</Text>
        <div>
          <Switch 
            checked={notificationsEnabled} 
            onChange={toggleNotifications} 
            size="small" 
            style={{ marginRight: 8 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {notificationsEnabled ? 'Activées' : 'Désactivées'}
          </Text>
        </div>
      </div>
      <Divider style={{ margin: 0 }} />
      
      {notificationsEnabled ? (
        <>
          {unreadCount > 0 && (
            <div style={{ padding: '4px 16px', textAlign: 'right' }}>
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  notifications
                    .filter(n => !n.read)
                    .forEach(n => markAsRead(n._id));
                }}
              >
                Marquer tout comme lu
              </Button>
            </div>
          )}
          
          <List
            dataSource={notifications.slice(0, 5)}
            renderItem={item => (
              <List.Item 
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: !item.read ? '#f0f7ff' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (!item.read) markAsRead(item._id);
                  setVisible(false);
                }}
              >
                <List.Item.Meta
                  title={<Text strong>{item.type}</Text>}
                  description={item.message}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </List.Item>
            )}
            locale={{ emptyText: 'Aucune notification' }}
          />
          
          {notifications.length > 5 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Button type="link" onClick={() => navigate('/notifications')}>Voir plus</Button>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text type="secondary">Les notifications sont désactivées</Text>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      placement="bottomRight"
    >
      <Badge count={notificationsEnabled ? unreadCount : 0} style={{ cursor: 'pointer' }}>
        <BellOutlined style={{ fontSize: 18, color: notificationsEnabled ? undefined : '#999' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;