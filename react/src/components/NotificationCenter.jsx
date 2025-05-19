import React, { useState } from 'react';
import { Badge, List, Popover, Typography, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;

const NotificationCenter = ({ notifications, unreadCount, onMarkAsRead }) => {
  const [visible, setVisible] = useState(false);

  const handleVisibleChange = (visible) => {
    setVisible(visible);
  };

  const notificationTypes = {
    success: { color: 'green', text: 'Succès' },
    error: { color: 'red', text: 'Erreur' },
    info: { color: 'blue', text: 'Information' },
    warning: { color: 'orange', text: 'Avertissement' }
  };

  const content = (
    <div style={{ width: 350 }}>
      <List
        size="small"
        header={<div>Notifications ({unreadCount} non lues)</div>}
        footer={<Button type="link" size="small">Voir toutes</Button>}
        bordered
        dataSource={notifications}
        renderItem={item => (
          <List.Item 
            style={{ 
              cursor: 'pointer',
              backgroundColor: !item.read ? '#f6ffed' : 'inherit'
            }}
            onClick={() => {
              onMarkAsRead(item._id);
              setVisible(false);
            }}
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>{item.title}</Text>
                  <Text type={notificationTypes[item.type]?.color || 'secondary'} style={{ fontSize: 12 }}>
                    {notificationTypes[item.type]?.text}
                  </Text>
                </div>
              }
              description={item.message}
            />
            <div style={{ fontSize: 10, color: '#999' }}>
              {moment(item.createdAt).fromNow()}
            </div>
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      title="Centre de notifications"
      trigger="click"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      placement="bottomRight"
    >
      <Badge count={unreadCount} overflowCount={9}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationCenter;