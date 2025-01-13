'use client';

import React, { useState } from 'react';
import { Form, Input, Typography, Card, Divider } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;

export default function RegisterJamRoom() {
    const [form] = Form.useForm();
  
    const onFinish = (values) => {
      console.log('Form values:', values);
      // We'll handle form submission in next steps
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          <Card>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
              Register Your Jam Room
            </Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="on"
            >
                <Title level={4}>Jam Room Details</Title>
              <Form.Item
                label="Jam Room Name"
                name="jamRoomName"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your jam room name',
                  },
                  {
                    min: 3,
                    message: 'Name must be at least 3 characters long',
                  },
                ]}
              >
                <Input 
                  placeholder="Enter jam room name"
                  maxLength={50}
                />
              </Form.Item>
    
              <Form.Item
                label="Description"
                name="description"
                rules={[
                  {
                    required: true,
                    message: 'Please enter a description',
                  },
                  {
                    min: 10,
                    message: 'Description must be at least 20 characters long',
                  },
                ]}
              >
                <TextArea 
                  placeholder="Describe your jam room..."
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Divider />

              <Title level={4}>Owner Details</Title>
          <Form.Item
            label="Full Name"
            name="ownerName"
            rules={[
              {
                required: true,
                message: 'Please enter your full name',
              },
              {
                min: 3,
                message: 'Name must be at least 3 characters long',
              },
            ]}
          >
            <Input 
              placeholder="Enter your full name"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="ownerEmail"
            rules={[
              {
                required: true,
                message: 'Please enter your email',
              },
              {
                type: 'email',
                message: 'Please enter a valid email',
              },
            ]}
          >
            <Input 
              placeholder="Enter your email"
              type="email"
            />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="ownerPhone"
            rules={[
              {
                required: true,
                message: 'Please enter your phone number',
              },
              {
                pattern: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number',
              },
            ]}
          >
            <Input 
              placeholder="Enter your phone number"
              maxLength={10}
            />
          </Form.Item>
            </Form>
          </Card>
        </div>
      );

}