"""
Pyjama DZ Camera System
POS (Point of Sale) & Cashier Activity Monitor
"""
import time
import random
import threading
from typing import Optional, Callable

class POSMonitor:
    """
    Monitors Point of Sale software actions, receipts, and cash drawer triggers.
    Includes simulated POS transaction generator for testing.
    """
    def __init__(self, on_discount_event_cb: Optional[Callable] = None):
        self.on_discount_event = on_discount_event_cb
        self.is_running = False
        self.thread: Optional[threading.Thread] = None

    def start_simulation(self):
        self.is_running = True
        self.thread = threading.Thread(target=self._sim_loop, daemon=True)
        self.thread.start()
        print("[POSMonitor] POS Transaction Monitor & Sniffer active.")

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)

    def trigger_manual_transaction(self, original: float, paid: float, discount: float, ticket_id: str):
        print(f"[POSMonitor] Manual Transaction: Ticket #{ticket_id} | Orig: {original}DA | Paid: {paid}DA | Remise: {discount}DA")
        if self.on_discount_event and discount > 0:
            self.on_discount_event(original, paid, discount, ticket_id)

    def _sim_loop(self):
        ticket_counter = 1000
        while self.is_running:
            # Simulate a transaction every 35-50 seconds
            time.sleep(random.uniform(35, 50))
            ticket_counter += 1

            # 25% chance of an abnormal discount event during simulation
            is_abnormal_discount = random.random() < 0.25

            if is_abnormal_discount:
                original = 2500.0
                discount = 1000.0
                paid = 1500.0
                print(f"[POSMonitor] ⚠️ Simulating Abnormal Discount: -1000 DA on Ticket #{ticket_counter}")
                if self.on_discount_event:
                    self.on_discount_event(original, paid, discount, str(ticket_counter))
            else:
                # Normal sale
                original = random.choice([1800.0, 2200.0, 3500.0, 4800.0])
                discount = random.choice([0.0, 100.0, 200.0])
                paid = original - discount
                # Normal transaction logged silently
