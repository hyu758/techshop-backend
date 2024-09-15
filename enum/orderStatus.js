const orderStatus = Object.freeze({
    PENDING: Symbol('pending'),
    SHIPPED: Symbol('shipped'),
    DELIVERED: Symbol('delivered'),
    CANCELLED: Symbol('cancelled')
})