import { SaasSubscriptionService } from './saas-subscription.service';
import { AppError } from '../../shared/helpers/errors';

const service = new SaasSubscriptionService();

/**
 * Verifica si una organización ha alcanzado el límite de una característica.
 * @param organizationId ID de la organización
 * @param feature Nombre de la característica (ej. 'students', 'instructors')
 * @param currentCount Cantidad actual de recursos utilizados
 * @throws AppError(403) si se excede el límite
 */
export async function verifyPlanLimit(
    organizationId: string,
    feature: string,
    currentCount: number
) {
    const allowed = await service.checkLimit(organizationId, feature, currentCount);

    if (!allowed) {
        throw new AppError(
            `Has alcanzado el límite de ${feature} para tu plan actual. Por favor actualiza tu suscripción.`,
            403,
            'FORBIDDEN'
        );
    }
}
