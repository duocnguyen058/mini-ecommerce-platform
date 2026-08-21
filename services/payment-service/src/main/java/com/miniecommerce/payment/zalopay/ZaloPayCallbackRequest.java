package com.miniecommerce.payment.zalopay;

public class ZaloPayCallbackRequest {
    private String data;
    private String mac;
    private Integer type;

    public ZaloPayCallbackRequest() {}

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getMac() { return mac; }
    public void setMac(String mac) { this.mac = mac; }

    public Integer getType() { return type; }
    public void setType(Integer type) { this.type = type; }
}
