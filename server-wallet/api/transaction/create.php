.card-body {
    transition: all 0.3s ease;

.card-body {
    transition: all 0.3s ease;
}
@keyframes balance-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); color: #28a745; }
    100% { transform: scale(1); }
}

.balance-updated {
    animation: balance-pulse 1.5s ease;
}
