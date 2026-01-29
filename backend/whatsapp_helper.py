"""
WhatsApp Helper Module
Provides Python interface to Node.js WhatsApp Web.js service
"""

import requests
from typing import Optional, Dict
import os
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_SERVICE_URL = os.getenv('WHATSAPP_SERVICE_URL', 'http://localhost:3001')

class WhatsAppService:
    """WhatsApp messaging service wrapper"""
    
    def __init__(self):
        self.base_url = WHATSAPP_SERVICE_URL
    
    def is_ready(self) -> bool:
        """Check if WhatsApp service is ready"""
        try:
            response = requests.get(f'{self.base_url}/health', timeout=2)
            if response.status_code == 200:
                data = response.json()
                return data.get('whatsapp_ready', False)
            return False
        except Exception as e:
            print(f"WhatsApp service check failed: {e}")
            return False
    
    def get_status(self) -> Dict:
        """Get WhatsApp service status"""
        try:
            response = requests.get(f'{self.base_url}/health', timeout=2)
            if response.status_code == 200:
                return response.json()
            return {'status': 'offline', 'whatsapp_ready': False}
        except Exception:
            return {'status': 'offline', 'whatsapp_ready': False}
    
    def send_message(self, phone: str, message: str) -> Dict:
        """
        Send WhatsApp message
        
        Args:
            phone: Phone number (with or without country code)
            message: Message text
            
        Returns:
            dict with success status and details
        """
        try:
            response = requests.post(
                f'{self.base_url}/send',
                json={'phone': phone, 'message': message},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                error_data = response.json()
                return {
                    'success': False,
                    'error': error_data.get('error', 'Unknown error')
                }
        except requests.exceptions.Timeout:
            return {'success': False, 'error': 'Request timeout'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def format_receipt(self, transaction: dict, items: list) -> str:
        """
        Format transaction receipt for WhatsApp
        
        Args:
            transaction: Transaction data
            items: List of cart items
            
        Returns:
            Formatted message string
        """
        # Header
        message = "🧼 *OTOPIA CAR WASH*\n"
        message += "━━━━━━━━━━━━━━━━━━━━\n\n"
        
        # Transaction info
        from datetime import datetime
        date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        message += f"📅 {date_str}\n"
        message += f"🎫 Invoice: {transaction.get('invoice_number', 'N/A')}\n\n"
        
        # Items
        message += "*LAYANAN:*\n"
        for item in items:
            name = item.get('name', 'Unknown')
            qty = item.get('quantity', 1)
            price = item.get('price', 0)
            total = price * qty
            message += f"• {name} x{qty}\n"
            message += f"  Rp {total:,.0f}\n"
        
        message += "\n━━━━━━━━━━━━━━━━━━━━\n"
        
        # Total
        total_amount = transaction.get('total', 0)
        payment_method = transaction.get('payment_method', 'cash').upper()
        message += f"*TOTAL:* Rp {total_amount:,.0f}\n"
        message += f"💳 Pembayaran: {payment_method}\n\n"
        
        # Footer
        message += "Terima kasih atas kunjungan Anda!\n"
        message += "Simpan struk ini sebagai bukti.\n\n"
        message += "📍 Jl. Sukun Raya No.47C, Semarang\n"
        message += "📞 0822-2702-5335"
        
        return message
    
    def send_receipt(self, phone: str, transaction: dict, items: list) -> Dict:
        """
        Send formatted receipt via WhatsApp
        
        Args:
            phone: Customer phone number
            transaction: Transaction data
            items: Cart items
            
        Returns:
            Send result
        """
        message = self.format_receipt(transaction, items)
        return self.send_message(phone, message)
    
    def send_membership_reminder(self, phone: str, customer_name: str, 
                                 membership_type: str, days_remaining: int, 
                                 usage_count: int) -> Dict:
        """Send membership reminder"""
        message = f"👑 *Membership Update*\n\n"
        message += f"Halo {customer_name}!\n\n"
        message += f"Membership {membership_type.upper()} Anda:\n"
        message += f"⏰ Sisa: {days_remaining} hari\n"
        message += f"🔢 Usage: {usage_count}x\n\n"
        message += "Jangan lupa gunakan benefit membership Anda!\n\n"
        message += "━━━━━━━━━━━━━━━━━━━━\n"
        message += "OTOPIA Car Wash\n"
        message += "📞 0822-2702-5335"
        
        return self.send_message(phone, message)


# Global instance
whatsapp = WhatsAppService()
