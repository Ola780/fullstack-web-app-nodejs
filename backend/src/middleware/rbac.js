export function requireRoles(...roles) {
    return (req, res, next) => {
        const role = req.user?.roleName;
        if (!role) return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(role)) return res.status(403).json({ message: "Forbidden. User does not have proper role" });
        next();
    };
}
