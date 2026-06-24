import { Injectable, CanActivate, ExecutionContext, ForbiddenException, mixin } from '@nestjs/common';
import { Role } from '@prisma/client';

export const RolesGuard = (roles: Role[]) => {
  class RolesGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request['user'];

      if (!user || !roles.includes(user.role)) {
        throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette ressource.");
      }
      return true;
    }
  }
  return mixin(RolesGuardMixin);
};