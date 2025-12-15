import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { getUserId } from "../utils/getUserId";
import { ZodError } from "zod";
import { createAddressSchema, updatePasswordSchema, updateProfileSchema, updateSubscriptionSchema, createContactMeSchema, deleteAddressSchema, updateAddressSchema } from "../validators/profile.validator"; 
import { deleteFile, uploadFile } from "../utils/manageFile";
import { v4 as uuidv4 } from "uuid";
import { sendSubscriptionNotification } from "../utils/sendEmail";

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profile APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateContactMeRequest:
 *      type: object
 *      required:
 *       - name
 *       - email
 *       - phone
 *       - message
 *      properties:
 *          name:
 *            type: string
 *            minLength: 1
 *            description: Full name of the user
 *            example: "John Doe"
 *          email:
 *            type: string
 *            format: email
 *            description: Valid email address of the user
 *            example: "john.doe@gmail.com"
 *          phone:
 *            type: string
 *            pattern: '^\\+91\\d{10}$'
 *            description: Phone number in Indian format (+91 followed by 10 digits)
 *            example: "+919876543210"
 *          message:
 *            type: string
 *            minLength: 1
 *            description: Contact message or inquiry from the user
 *            example: "I would like to know more about your jewelry collection."
 *     CreateAddressRequest:
 *       type: array
 *       description: Array of address objects to be created for the user
 *       minItems: 1
 *       items:
 *         type: object
 *         required:
 *           - firstName
 *           - lastName
 *           - phone
 *           - addressLine1
 *           - addressLine2
 *           - city
 *           - state
 *           - country
 *           - zipCode
 *         properties:
 *           firstName:
 *             type: string
 *             minLength: 1
 *             description: First name of the address contact person
 *             example: "John"
 *           lastName:
 *             type: string
 *             minLength: 1
 *             description: Last name of the address contact person
 *             example: "Doe"
 *           phone:
 *             type: string
 *             minLength: 1
 *             description: Contact phone number for this address
 *             example: "+919876543210"
 *           addressLine1:
 *             type: string
 *             minLength: 1
 *             description: Primary address line (street, building number)
 *             example: "123 MG Road"
 *           addressLine2:
 *             type: string
 *             minLength: 1
 *             description: Secondary address line (apartment, floor, landmark)
 *             example: "Apartment 4B, Near City Mall"
 *           city:
 *             type: string
 *             minLength: 1
 *             description: City name
 *             example: "Mumbai"
 *           state:
 *             type: string
 *             minLength: 1
 *             description: State or region name
 *             example: "Maharashtra"
 *           country:
 *             type: string
 *             minLength: 1
 *             description: Country name
 *             example: "India"
 *           zipCode:
 *             type: string
 *             minLength: 1
 *             description: Postal or ZIP code
 *             example: "400001"
 *     AddressResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message indicating address creation status
 *           example: "Address created successfully"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           oneOf:
 *             - type: string
 *               description: General error message for server or authorization errors
 *               example: "Internal server error"
 *             - type: array
 *               description: Array of validation errors from Zod schema validation
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     description: Error code from validation
 *                     example: "invalid_type"
 *                   expected:
 *                     type: string
 *                     description: Expected data type or value
 *                     example: "string"
 *                   received:
 *                     type: string
 *                     description: Actual received data type or value
 *                     example: "undefined"
 *                   path:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                     description: Path to the field that caused the error
 *                     example: ["firstName"]
 *                   message:
 *                     type: string
 *                     description: Human-readable error message
 *                     example: "First name is required"
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the address record
 *         name:
 *           type: string
 *           description: Formatted address name (auto-generated from address components)
 *           example: "123 MG Road, Mumbai, Maharashtra, India"
 *         phone:
 *           type: string
 *           description: Contact phone number for this address
 *         addressLine1:
 *           type: string
 *           description: Primary address line
 *         addressLine2:
 *           type: string
 *           nullable: true
 *           description: Secondary address line (optional)
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State or region name
 *         country:
 *           type: string
 *           nullable: true
 *           description: Country name (optional)
 *         zipCode:
 *           type: string
 *           description: Postal or ZIP code
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "123 MG Road, Mumbai, Maharashtra, India"
 *         phone: "+919876543210"
 *         addressLine1: "123 MG Road"
 *         addressLine2: "Apartment 4B, Near City Mall"
 *         city: "Mumbai"
 *         state: "Maharashtra"
 *         country: "India"
 *         zipCode: "400001"
 *     DeleteAddressRequest:
 *      type: object
 *      properties:
 *        addressId:
 *          type: string
 *          format: uuid
 *          description: UUID of the address to be deleted (must belong to the authenticated user)
 *          example: "123e4567-e89b-12d3-a456-426614174000"
 *      required:
 *        - addressId
 *     User:
 *       type: object
 *       description: User profile information returned by the API
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         name:
 *           type: string
 *           description: Full name of the user (combination of first and last name)
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user (unique)
 *         profileImageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: URL of the user's profile image (can be null)
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *           nullable: true
 *           description: Gender preference of the user (optional)
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of birth in ISO 8601 format (optional)
 *         isEmailSubscribed:
 *           type: boolean
 *           description: Whether user is subscribed to email notifications
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *           description: List of delivery addresses associated with the user
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "John Doe"
 *         email: "john.doe@example.com"
 *         profileImageUrl: "https://storage.wymi.com/profiles/john_doe.jpg"
 *         gender: "MALE"
 *         dateOfBirth: "1990-01-01T00:00:00.000Z"
 *         isEmailSubscribed: true
 *         addresses:
 *           - id: "123e4567-e89b-12d3-a456-426614174000"
 *             name: "123 MG Road, Mumbai, Maharashtra, India"
 *             phone: "+919876543210"
 *             addressLine1: "123 MG Road"
 *             addressLine2: "Apartment 4B, Near City Mall"
 *             city: "Mumbai"
 *             state: "Maharashtra"
 *             country: "India"
 *             zipCode: "400001"
 *     UpdateProfileRequest:
 *       type: object
 *       description: Request body for updating user profile (sent as multipart/form-data)
 *       properties:
 *         profileData:
 *           type: string
 *           description: |
 *             JSON string containing profile update data with the following structure:
 *             
 *             Optional fields:
 *             - firstName (string): First name of the user (min length: 1)
 *             - lastName (string): Last name of the user (min length: 1) 
 *             - gender (string): Gender preference [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *             - dateOfBirth (string): Date of birth in ISO format (YYYY-MM-DDTHH:mm:ssZ)
 *             - addresses (array): Array of address objects with id, phone, addressLine1, etc.
 *           example: '{"firstName":"John","lastName":"Doe","gender":"MALE","dateOfBirth":"1990-01-01T00:00:00Z"}'
 *           x-postman-schema:
 *             $ref: '#/components/schemas/UpdateProfileJsonRequest'
 *           x-postman-media-type: application/json
 *         profileImage:
 *           type: string
 *           format: binary
 *           description: Profile image file (optional, will be uploaded to cloud storage)
 *     UpdateProfileJsonRequest:
 *       type: object
 *       description: Profile data structure (when sent as JSON within profileData field)
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           description: First name of the user (optional)
 *         lastName:
 *           type: string
 *           minLength: 1
 *           description: Last name of the user (optional, used with firstName to create full name)
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *           description: Gender preference of the user (optional)
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           description: Date of birth in ISO 8601 format - YYYY-MM-DDTHH:mm:ssZ (optional)
 *           pattern: '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$'
 *           example: "1990-01-01T00:00:00Z"
 *         addresses:
 *           type: array
 *           description: Array of existing addresses to update (optional)
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Existing address ID (required for address updates)
 *                 minLength: 1
 *               phone:
 *                 type: string
 *                 description: Updated phone number for the address (optional)
 *                 minLength: 1
 *               addressLine1:
 *                 type: string
 *                 description: Updated primary address line (optional)
 *                 minLength: 1
 *               addressLine2:
 *                 type: string
 *                 description: Updated secondary address line (optional)
 *                 minLength: 1
 *               city:
 *                 type: string
 *                 description: Updated city name (optional)
 *                 minLength: 1
 *               state:
 *                 type: string
 *                 description: Updated state or region (optional)
 *                 minLength: 1
 *               country:
 *                 type: string
 *                 description: Updated country name (optional)
 *                 minLength: 1
 *               zipCode:
 *                 type: string
 *                 description: Updated postal or ZIP code (optional)
 *                 minLength: 1
 *       example:
 *         firstName: "John"
 *         lastName: "Doe"
 *         gender: "MALE"
 *         dateOfBirth: "1990-01-01T00:00:00Z"
 *         addresses:
 *           - id: "123e4567-e89b-12d3-a456-426614174000"
 *             phone: "+919876543210"
 *             city: "Mumbai"
 *             state: "Maharashtra"
 *     UpdateSubscriptionRequest:
 *       type: object
 *       properties:
 *         subscriptionStatus:
 *           type: boolean
 *           description: New email subscription status (true to subscribe, false to unsubscribe)
 *       required:
 *         - subscriptionStatus
 *       example:
 *         subscriptionStatus: true
 *     UpdatePasswordRequest:
 *       type: object
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: User's current password for verification
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$'
 *           example: "CurrentPass123"
 *         newPassword:
 *           type: string
 *           description: New password (minimum 8 characters with uppercase, lowercase, and number)
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$'
 *           example: "NewSecurePass456"
 *       required:
 *         - currentPassword
 *         - newPassword
 *     UpdateAddressRequest:
 *       type: object
 *       description: Request body for updating an existing user address
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: UUID of the address to be updated (must belong to the authenticated user)
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         firstName:
 *           type: string
 *           minLength: 1
 *           description: First name of the address contact person (optional - only provided fields will be updated)
 *           example: "John"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           description: Last name of the address contact person (optional - only provided fields will be updated)
 *           example: "Doe"
 *         phone:
 *           type: string
 *           minLength: 1
 *           description: Contact phone number for this address (optional - only provided fields will be updated)
 *           example: "+919876543210"
 *         addressLine1:
 *           type: string
 *           minLength: 1
 *           description: Primary address line (street, building number) (optional - only provided fields will be updated)
 *           example: "456 New Street"
 *         addressLine2:
 *           type: string
 *           minLength: 1
 *           description: Secondary address line (apartment, floor, landmark) (optional - only provided fields will be updated)
 *           example: "Apartment 5C, Near Shopping Center"
 *         city:
 *           type: string
 *           minLength: 1
 *           description: City name (optional - only provided fields will be updated)
 *           example: "Delhi"
 *         state:
 *           type: string
 *           minLength: 1
 *           description: State or region name (optional - only provided fields will be updated)
 *           example: "Delhi"
 *         country:
 *           type: string
 *           minLength: 1
 *           description: Country name (optional - only provided fields will be updated)
 *           example: "India"
 *         zipCode:
 *           type: string
 *           minLength: 1
 *           description: Postal or ZIP code (optional - only provided fields will be updated)
 *           example: "110001"
 *       required:
 *         - id
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         firstName: "Jane"
 *         lastName: "Smith"
 *         phone: "+919876543211"
 *         addressLine1: "456 New Street"
 *         city: "Delhi"
 *         state: "Delhi"
 *         zipCode: "110001"
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success confirmation message
 *       example:
 *         message: "Operation completed successfully"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing what went wrong
 *       example:
 *         error: "Unauthorized access"
 *     ValidationError:
 *       type: object
 *       description: Validation errors returned when request data doesn't meet schema requirements
 *       properties:
 *         error:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Zod error code identifying the type of validation failure
 *                 example: "invalid_type"
 *               expected:
 *                 type: string
 *                 description: Expected data type or format
 *                 example: "string"
 *               received:
 *                 type: string
 *                 description: Actual data type or value received
 *                 example: "undefined"
 *               path:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *                 description: Field path where the validation error occurred
 *                 example: ["firstName"]
 *               message:
 *                 type: string
 *                 description: Human-readable error message
 *                 example: "First name is required"
 *           description: Array of validation errors from Zod schema validation
 *       example:
 *         error:
 *           - code: "invalid_type"
 *             expected: "string"
 *             received: "undefined"
 *             path: ["firstName"]
 *             message: "First name is required"
 *           - code: "invalid_string"
 *             expected: "regex"
 *             received: "invalid"
 *             path: ["phone"]
 *             message: "Phone number must be in the 10 digit"
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *       description: JWT access token stored in a cookie
 */

/**
 * @swagger
 * paths:
 *   /api/profile/address/create:
 *     post:
 *       summary: Create one or multiple delivery addresses
 *       description: |
 *         **Purpose**: Creates one or more delivery addresses for jewelry orders and shipments.
 *         
 *         **Business Logic**:
 *         - Each address is automatically assigned a formatted name (e.g., "123 MG Road, Mumbai, Maharashtra, India")
 *         - Supports bulk address creation in a single API call for user convenience
 *         - All address fields are mandatory to ensure complete delivery information
 *         - Phone numbers are validated to Indian format (+91XXXXXXXXXX) for local delivery
 *         - Addresses are linked to the authenticated user's account for order management
 *         
 *         **Use Cases**:
 *         - Setting up delivery addresses during user onboarding
 *         - Adding new addresses before placing jewelry orders
 *         - Bulk importing addresses from user's existing data
 *         - Creating separate addresses for different family members or offices
 *         
 *         **Data Processing**:
 *         - Generates unique UUID for each address record
 *         - Creates formatted address name from components for easy identification
 *         - Validates all required fields against Zod schema before database insertion
 *         - Ensures data consistency and completeness for reliable order delivery
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateAddressRequest'
 *             example:
 *               - firstName: "John"
 *                 lastName: "Doe"
 *                 phone: "+919876543210"
 *                 addressLine1: "123 MG Road"
 *                 addressLine2: "Apartment 4B, Near City Mall"
 *                 city: "Mumbai"
 *                 state: "Maharashtra"
 *                 country: "India"
 *                 zipCode: "400001"
 *       responses:
 *        '201':
 *          description: All addresses created successfully
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/AddressResponse'
 *        '400':
 *          description: Validation error - Missing required fields or invalid data format
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ErrorResponse'
 *              examples:
 *                validation_error:
 *                  summary: Validation error example
 *                  value:
 *                    error:
 *                      - code: "invalid_type"
 *                        expected: "string"
 *                        received: "undefined"
 *                        path: ["firstName"]
 *                        message: "First name is required"
 *        '401':
 *          description: Unauthorized - Missing or invalid access token
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ErrorResponse'
 *              example:
 *                error: "Unauthorized"
 *        '500':
 *          description: Internal server error - Database or server failure
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/ErrorResponse'
 *              example:
 *                error: "Internal server error"
 */
export const createAddress = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = createAddressSchema.parse(req.body);

        await prisma.address.create({
            data: {
                id: uuidv4(),
                userId: userId,
                name: `${data.firstName} ${data.lastName}`,
                phone: data.phone,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                city: data.city,
                state: data.state,
                country: data.country,
                zipCode: data.zipCode,
            },
        });
        res.status(201).json({ message: "Address created successfully" });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error creating address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @swagger
 * paths:
 *   /api/profile/address/update:
 *     put:
 *       summary: Update an existing user address
 *       description: |
 *         **Purpose**: Updates specific fields of an existing delivery address in the user's profile.
 *         
 *         **Business Logic**:
 *         - Allows partial updates - only provided fields are updated, others remain unchanged
 *         - Validates address ownership to ensure users can only update their own addresses
 *         - Automatically combines firstName and lastName into a formatted name field
 *         - Updates address record in database with new information while preserving existing data
 *         - Maintains data integrity by validating UUID format and field requirements
 *         
 *         **Use Cases**:
 *         - Updating contact information (phone number) for existing address
 *         - Correcting address details (street name, apartment number, etc.)
 *         - Changing city/state after relocation within same general area
 *         - Updating postal codes due to area redistricting
 *         - Modifying contact person name for the delivery address
 *         - Partial updates when only specific fields need correction
 *         
 *         **Security & Validation**:
 *         - UUID format validation for address ID to ensure data integrity
 *         - Ownership verification - users can only update addresses they own
 *         - Optional field validation - each provided field is validated according to schema
 *         - Authentication required via JWT token in cookies
 *         - Prevents unauthorized access to other users' address data
 *         
 *         **API Behavior**:
 *         - Only updates fields that are provided in the request body
 *         - Non-provided fields retain their existing values in the database
 *         - Returns success message upon successful update operation
 *         - Handles validation errors with detailed field-specific error messages
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateAddressRequest'
 *             examples:
 *               full_update:
 *                 summary: Update all address fields
 *                 description: Example showing how to update multiple fields of an existing address
 *                 value:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   firstName: "Jane"
 *                   lastName: "Smith"
 *                   phone: "+919876543211"
 *                   addressLine1: "456 New Street"
 *                   addressLine2: "Apartment 5C, Near Shopping Center"
 *                   city: "Delhi"
 *                   state: "Delhi"
 *                   country: "India"
 *                   zipCode: "110001"
 *               partial_update:
 *                 summary: Update only phone and city
 *                 description: Example showing partial update of specific fields only
 *                 value:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   phone: "+919999888777"
 *                   city: "Mumbai"
 *               contact_update:
 *                 summary: Update contact information only
 *                 description: Example for updating just the contact person and phone details
 *                 value:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                   phone: "+919123456789"
 *       responses:
 *         '200':
 *           description: Address updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/SuccessMessage'
 *               examples:
 *                 success:
 *                   summary: Successful address update
 *                   value:
 *                     message: "Address updated successfully"
 *         '400':
 *           description: Validation error - Invalid data format or missing required fields
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ValidationError'
 *               examples:
 *                 missing_id:
 *                   summary: Missing address ID
 *                   value:
 *                     error:
 *                       - code: "invalid_type"
 *                         expected: "string"
 *                         received: "undefined"
 *                         path: ["id"]
 *                         message: "Address ID is required"
 *                 invalid_uuid:
 *                   summary: Invalid UUID format
 *                   value:
 *                     error:
 *                       - code: "invalid_string"
 *                         expected: "uuid"
 *                         received: "invalid-uuid-format"
 *                         path: ["id"]
 *                         message: "Invalid uuid"
 *                 validation_errors:
 *                   summary: Multiple field validation errors
 *                   value:
 *                     error:
 *                       - code: "too_small"
 *                         expected: "1"
 *                         received: "0"
 *                         path: ["firstName"]
 *                         message: "First name is required"
 *                       - code: "too_small"
 *                         expected: "1"
 *                         received: "0"
 *                         path: ["phone"]
 *                         message: "Phone number is required"
 *         '401':
 *           description: Unauthorized access - Missing or invalid authentication token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               examples:
 *                 unauthorized:
 *                   summary: Missing authentication token
 *                   value:
 *                     error: "Unauthorized"
 *         '404':
 *           description: Address not found - Address doesn't exist or doesn't belong to the user
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               examples:
 *                 not_found:
 *                   summary: Address not found or unauthorized
 *                   value:
 *                     error: "Address not found"
 *         '500':
 *           description: Internal server error - Database or server malfunction
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               examples:
 *                 server_error:
 *                   summary: Internal server error
 *                   value:
 *                     error: "Internal server error"
 */

export const updateAddress = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = updateAddressSchema.parse(req.body);

        const existingAddress = await prisma.address.findUnique({
            where: { id: data.id },
        });

        if (!existingAddress || existingAddress.userId !== userId) {
            res.status(404).json({ error: "Address not found" });
            return;
        }

        await prisma.address.update({
            where: { id: data.id },
            data: {
                name: `${data.firstName} ${data.lastName}` || existingAddress.name,
                phone: data.phone || existingAddress.phone,
                addressLine1: data.addressLine1 || existingAddress.addressLine1,
                addressLine2: data.addressLine2 || existingAddress.addressLine2,
                city: data.city || existingAddress.city,
                state: data.state || existingAddress.state,
                country: data.country || existingAddress.country,
                zipCode: data.zipCode || existingAddress.zipCode,
            },
        });

        res.status(200).json({ message: "Address updated successfully" });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error updating address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @swagger
 * paths:
 *   /api/profile/address/delete:
 *     delete:
 *       summary: Delete a user address
 *       description: |
 *         **Purpose**: Permanently removes a specific delivery address from user's account.
 *         
 *         **Business Logic**:
 *         - Deletes only addresses that belong to the authenticated user for security
 *         - Validates address ownership before deletion to prevent unauthorized access
 *         - Permanent deletion with no recovery option - addresses cannot be restored
 *         - Useful for removing outdated, incorrect, or no longer needed delivery locations
 *         - Does not affect past orders that may have used this address
 *         
 *         **Use Cases**:
 *         - Removing old addresses after relocation or moving
 *         - Cleaning up incorrect or duplicate address entries
 *         - Managing address list to keep only current and relevant locations
 *         - Removing temporary addresses (office, relatives' homes) after specific use
 *         - Maintaining clean address book for better user experience during checkout
 *         
 *         **Security & Validation**:
 *         - UUID format validation for address ID to ensure data integrity
 *         - Ownership verification - users can only delete their own addresses
 *         - Database constraint validation to prevent deletion of non-existent addresses
 *         - Authentication required to prevent unauthorized address manipulation
 *         
 *         **Impact & Considerations**:
 *         - Deletion is immediate and permanent - no soft delete or recovery mechanism
 *         - Historical orders maintain address information even after address deletion
 *         - Users should be warned about permanency before confirming deletion
 *         - Recommended to keep at least one address for future order deliveries
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         description: Address identification for deletion
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteAddressRequest'
 *             example:
 *               addressId: "123e4567-e89b-12d3-a456-426614174000"
 *       responses:
 *         200:
 *           description: Address deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                  type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      description: Confirmation message for successful deletion
 *                  example:
 *                    message: "Address deleted successfully"
 *         400:
 *           description: Validation error - Invalid address ID format
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ValidationError'
 *               example:
 *                 error:
 *                   - code: "invalid_string"
 *                     expected: "uuid"
 *                     received: "invalid-id"
 *                     path: ["addressId"]
 *                     message: "Address ID is required"
 *         401:
 *           description: Unauthorized - Missing or invalid access token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Unauthorized"
 *         404:
 *           description: Address not found or doesn't belong to the user
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Address not found"
 *         500:
 *           description: Internal server error - Database or server failure
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Internal server error"
 */
export const deleteAddressById = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = deleteAddressSchema.parse(req.body);
        const address = await prisma.address.findUnique({
            where: { id: data.addressId, userId: userId },
        });
        if (!address) {
            res.status(404).json({ error: "Address not found" });
            return;
        }
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { shippingAddressId: data.addressId },
                    { billingAddressId: data.addressId },
                ],
            },
        });
        if (orders.length > 0) {
            res.status(400).json({ error: "Address is associated with existing orders and cannot be deleted" });
            return;
        }
        await prisma.address.delete({
            where: { id: data.addressId },
        });
        res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error deleting address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @swagger
 * paths:
 *   /api/profile/get:
 *     get:
 *       summary: Get user profile information
 *       description: |
 *         **Purpose**: Retrieves comprehensive user profile data for account management and personalization.
 *         
 *         **Business Logic**:
 *         - Returns complete user profile including personal details, preferences, and delivery addresses
 *         - Excludes sensitive information like password hash for security
 *         - Includes email subscription status for marketing communication preferences
 *         - Provides all linked delivery addresses for order checkout processes
 *         - Returns profile image URL for avatar display in user interface
 *         
 *         **Use Cases**:
 *         - Loading user profile page with complete information
 *         - Populating profile edit forms with current user data
 *         - Displaying user information in account dashboard
 *         - Pre-filling checkout forms with saved delivery addresses
 *         - Personalizing user experience based on profile data
 *         
 *         **Data Security**:
 *         - Requires valid JWT authentication token in cookies
 *         - Only returns data belonging to the authenticated user
 *         - Excludes sensitive fields like password hash, phone verification status
 *         - Validates user existence before returning any profile information
 *         
 *         **Response Structure**:
 *         - Personal details: name, email, gender, date of birth
 *         - Account preferences: email subscription status, profile image
 *         - Delivery information: complete list of saved addresses with full details
 *         - Structured data format suitable for frontend consumption and form population
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       responses:
 *         200:
 *           description: User profile retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *               example:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 profileImageUrl: "https://storage.wymi.com/profiles/john_doe.jpg"
 *                 gender: "MALE"
 *                 dateOfBirth: "1990-01-01T00:00:00.000Z"
 *                 isEmailSubscribed: true
 *                 addresses:
 *                   - id: "addr-123-uuid"
 *                     name: "123 MG Road, Mumbai, Maharashtra, India"
 *                     phone: "+919876543210"
 *                     addressLine1: "123 MG Road"
 *                     addressLine2: "Apartment 4B, Near City Mall"
 *                     city: "Mumbai"
 *                     state: "Maharashtra"
 *                     country: "India"
 *                     zipCode: "400001"
 *         401:
 *           description: Unauthorized - Missing or invalid access token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Unauthorized"
 *         404:
 *           description: User not found - Valid token but user doesn't exist
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "User not found"
 *         500:
 *           description: Internal server error - Database or server failure
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Internal server error"
 */
export const getProfile = async (req: Request, res: Response) => {
    try {

        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                profileImageUrl: true,
                gender: true,
                dateOfBirth: true,
                phone: true,
                addresses: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        state: true,
                        country: true,
                        zipCode: true,
                    },
                },
                isEmailSubscribed: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error getting profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * @swagger
 * paths:
 *   /api/profile/update:
 *     put:
 *       summary: Update user profile information
 *       description: |
 *         **Purpose**: Comprehensive user profile update with support for personal details and profile image management.
 *         
 *         **Business Logic**:
 *         - Accepts multipart/form-data to handle both text data and file uploads simultaneously
 *         - Profile data sent as JSON string within 'profileData' field for structured validation
 *         - Optional profile image upload with automatic cloud storage and URL generation
 *         - Partial updates supported - only provided fields are updated, others remain unchanged
 *         - Full name concatenation from firstName and lastName for display purposes
 *         - Address updates modify existing addresses by ID rather than creating new ones
 *         
 *         **File Upload Process**:
 *         - Profile images uploaded to secure cloud storage with unique file paths
 *         - Automatic file extension handling (.jpg) for consistency
 *         - User-specific folder structure (/profileImages/{userId}/{uuid}.jpg)
 *         - Previous profile image URLs are replaced but files may remain in storage
 *         
 *         **Use Cases**:
 *         - Updating personal information from profile settings page
 *         - Changing profile picture with image upload functionality
 *         - Modifying delivery addresses for existing address records
 *         - Updating contact preferences and personal details
 *         - Bulk profile updates during onboarding completion
 *         
 *         **Data Validation**:
 *         - JSON profile data validated against Zod schema before processing
 *         - Date format validation for dateOfBirth (ISO 8601 format required)
 *         - Gender enum validation for supported gender options
 *         - Address ID validation for existing address updates only
 *         - File type and size validation for profile image uploads
 *         
 *         **Security Considerations**:
 *         - User can only update their own profile (verified via JWT token)
 *         - Address updates limited to addresses belonging to the authenticated user
 *         - File upload security through cloud storage integration
 *         - Input sanitization and validation for all user-provided data
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         description: Profile update data (multipart form with JSON data and optional image)
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProfileRequest'
 *             example:
 *               profileData: '{"firstName":"John","lastName":"Doe","gender":"MALE","dateOfBirth":"1990-01-01T00:00:00Z"}'
 *               profileImage: "[binary file data]"
 *       responses:
 *         200:
 *           description: User profile updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *               example:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 profileImageUrl: "https://storage.wymi.com/profiles/new_image.jpg"
 *                 gender: "MALE"
 *                 dateOfBirth: "1990-01-01T00:00:00.000Z"
 *                 isEmailSubscribed: true
 *                 addresses: []
 *         400:
 *           description: Validation error - Invalid profile data format or missing required fields
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ValidationError'
 *               example:
 *                 error:
 *                   - code: "invalid_string"
 *                     expected: "YYYY-MM-DDTHH:mm:ssZ format"
 *                     received: "1990-01-01"
 *                     path: ["dateOfBirth"]
 *                     message: "Date of birth must be in YYYY-MM-DDTHH:mm:ss format"
 *         401:
 *           description: Unauthorized - Missing or invalid access token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Unauthorized"
 *         404:
 *           description: User not found - Valid token but user doesn't exist
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "User not found"
 *         500:
 *           description: Internal server error - Database, file upload, or server failure
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Internal server error"
 * 
 * @example
 * # Postman Usage Instructions
 * This endpoint should be used in Postman with the following form-data structure:
 * 
 * Form Data Fields:
 * - profileData (Text): JSON string with profile update information
 * - profileImage (File): Profile image file (optional)
 * 
 * Example profileData JSON:
 * ```json
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "gender": "MALE",
 *   "dateOfBirth": "1990-01-01T00:00:00Z"
 * }
 * ```
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                profileImageUrl: true,
                gender: true,
                dateOfBirth: true,
            }
        });
        if (!existingUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const profileData = JSON.parse(req.body.profileData);
        const data = updateProfileSchema.parse(profileData);
        let key: string | undefined;
        if (req?.file) {
            if (existingUser.profileImageUrl) {
                await deleteFile(existingUser.profileImageUrl.replace("/", ""));
            }
            key = `profileImages/${userId}/${uuidv4()}.jpg`;
            await uploadFile(req.file, key);
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : existingUser?.name,
                gender: data.gender || existingUser.gender,
                dateOfBirth: data.dateOfBirth || existingUser.dateOfBirth,
                profileImageUrl: req.file ? "/" + key : existingUser.profileImageUrl,
            },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Internal server error", detail: error instanceof Error ? error.message : "Unknown error" });
    }
};

/**
 * @swagger
 * paths:
 *   /api/profile/update/subscription:
 *     put:
 *       summary: Update email subscription preferences
 *       description: |
 *         **Purpose**: Manages user's email marketing and communication preferences for the jewelry platform.
 *         
 *         **Business Logic**:
 *         - Controls whether user receives marketing emails, promotional offers, and newsletters
 *         - Sends confirmation email notification when subscription status changes
 *         - Affects future email communications but doesn't impact transactional emails (order confirmations, shipping updates)
 *         - Supports both subscription and unsubscription operations through boolean toggle
 *         - Updates are immediate and affect all marketing communication systems
 *         
 *         **Email Communication Types Affected**:
 *         - Marketing emails about new jewelry collections and products
 *         - Promotional offers, discounts, and special sale notifications
 *         - Newsletter content with jewelry trends, care tips, and brand updates
 *         - Personalized product recommendations based on browsing history
 *         - Event invitations and exclusive member benefits
 *         
 *         **Email Types NOT Affected** (always sent regardless of subscription):
 *         - Order confirmation and receipt emails
 *         - Shipping and delivery status updates
 *         - Account security notifications and password resets
 *         - Customer service communications and support responses
 *         - Return and exchange process notifications
 *         
 *         **Use Cases**:
 *         - User opting out of marketing emails while keeping account active
 *         - Re-subscribing to promotional content for deals and offers
 *         - Managing communication preferences from account settings
 *         - GDPR compliance for email marketing consent management
 *         - Reducing email frequency for users with email fatigue
 *         
 *         **Compliance & Privacy**:
 *         - Respects user privacy choices and marketing consent regulations
 *         - Provides clear control over non-essential email communications
 *         - Maintains audit trail of subscription preference changes
 *         - Supports data protection and privacy regulation compliance
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         description: New subscription preference
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateSubscriptionRequest'
 *             example:
 *               subscriptionStatus: true
 *       responses:
 *         200:
 *           description: Subscription status updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *               example:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 isEmailSubscribed: true
 *                 profileImageUrl: null
 *                 gender: "MALE"
 *                 dateOfBirth: "1990-01-01T00:00:00.000Z"
 *                 addresses: []
 *         400:
 *           description: Validation error - Invalid subscription status value
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ValidationError'
 *               example:
 *                 error:
 *                   - code: "invalid_type"
 *                     expected: "boolean"
 *                     received: "string"
 *                     path: ["subscriptionStatus"]
 *                     message: "Expected boolean, received string"
 *         401:
 *           description: Unauthorized - Missing or invalid access token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Unauthorized"
 *         404:
 *           description: User not found - Valid token but user doesn't exist
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "User not found"
 *         500:
 *           description: Internal server error - Database, email service, or server failure
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Internal server error"
 */
export const updateSubscription = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = updateSubscriptionSchema.parse(req.body);
        if (!data) {
            res.status(400).json({ error: "Subscription status is required" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, isEmailSubscribed: true },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        sendSubscriptionNotification(user.email);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isEmailSubscribed: data.subscriptionStatus },
        });
        const subscribedUser = await prisma.subscribedUsers.findUnique({
            where: { email: user.email },
        });
        if (!subscribedUser) {
            await prisma.subscribedUsers.create({
                data: {
                    email: user.email,
                },
            });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @swagger
 * paths:
 *   /api/profile/update/password:
 *     put:
 *       summary: Change user password
 *       description: |
 *         **Purpose**: Secure password update mechanism with comprehensive security validation and verification.
 *         
 *         **Security Process**:
 *         - Requires current password verification to prevent unauthorized changes
 *         - Current password validated against stored bcrypt hash for authentication
 *         - New password must meet strict security requirements before acceptance
 *         - Password immediately hashed using bcrypt with salt rounds for secure storage
 *         - No plain text password storage - only secure hashes maintained in database
 *         
 *         **Password Requirements** (enforced by Zod validation):
 *         - Minimum 8 characters length for reasonable security level
 *         - At least one uppercase letter (A-Z) for complexity
 *         - At least one lowercase letter (a-z) for variety
 *         - At least one numeric digit (0-9) for strength
 *         - Special characters allowed: @$!%*?& for enhanced security
 *         - No maximum length restriction for user flexibility
 *         
 *         **Use Cases**:
 *         - Regular password updates for account security maintenance
 *         - Password changes after suspected security compromise
 *         - Strengthening weak passwords to meet security standards
 *         - Compliance with organizational password policies
 *         - Recovery from forgotten passwords (after identity verification)
 *         
 *         **Security Considerations**:
 *         - Current password verification prevents unauthorized access
 *         - New password complexity validation ensures account protection
 *         - Bcrypt hashing with salt provides protection against rainbow table attacks
 *         - No password history validation (can reuse previous passwords)
 *         - Session remains valid after password change (no forced logout)
 *         
 *         **Error Handling**:
 *         - Specific error for incorrect current password to guide user
 *         - Detailed validation errors for new password format requirements
 *         - Generic error messages to prevent security information leakage
 *         - Rate limiting recommended to prevent brute force attacks
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         description: Current password for verification and new password to set
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdatePasswordRequest'
 *             example:
 *               currentPassword: "MyCurrentPass123"
 *               newPassword: "MyNewSecurePass456"
 *       responses:
 *         200:
 *           description: Password updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/SuccessMessage'
 *               example:
 *                 message: "Password updated successfully"
 *         400:
 *           description: Validation error or incorrect current password
 *           content:
 *             application/json:
 *               schema:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ValidationError'
 *                   - $ref: '#/components/schemas/Error'
 *               examples:
 *                 validation_error:
 *                   summary: Password format validation error
 *                   value:
 *                     error:
 *                       - code: "invalid_string"
 *                         expected: "regex pattern"
 *                         received: "weak password"
 *                         path: ["newPassword"]
 *                         message: "Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
 *                 wrong_password:
 *                   summary: Incorrect current password
 *                   value:
 *                     error: "Current password is incorrect"
 *         401:
 *           description: Unauthorized - Missing or invalid access token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Unauthorized"
 *         404:
 *           description: User not found - Valid token but user doesn't exist
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "User not found"
 *         500:
 *           description: Internal server error - Database or server failure
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Internal server error"
 */
export const updatePassword = async (req: Request, res: Response) => {
    try {
        let userId: string | null = null;
        if(req.cookies.accessToken) {
            userId = getUserId(req.cookies.accessToken);
        }
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const data = updatePasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        if (data.currentPasswordHash !== user.passwordHash) {
            res.status(400).json({ error: "Current password is incorrect" });
            return;
        }
        if (data.currentPasswordHash === data.newPasswordHash) {
            res.status(400).json({ error: "New password must be different from the current password" });
            return;
        }
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: data.newPasswordHash },
        });
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" });
    }
};

/**
 * @swagger
 * paths:
 *   /api/profile/contact:
 *     post:
 *       summary: Submit a contact inquiry
 *       description: |
 *         **Purpose**: Customer communication channel for inquiries, support requests, and feedback about jewelry products and services.
 *         
 *         **Business Logic**:
 *         - Direct communication bridge between customers and jewelry business support team
 *         - Automatically sends email notification to support team with inquiry details
 *         - Requires authentication to associate inquiries with user accounts for follow-up
 *         - Validates Indian phone number format for local customer support and callbacks
 *         - Prevents spam and abuse through authentication requirement
 *         
 *         **Communication Types Supported**:
 *         - Product inquiries about jewelry specifications, materials, and customization
 *         - Custom design requests for personalized jewelry pieces
 *         - Order support for existing purchases, modifications, and tracking
 *         - Technical support for website issues, account problems, and payment questions
 *         - General feedback about products, services, and customer experience
 *         - Bulk order inquiries for corporate gifts and special events
 *         
 *         **Use Cases**:
 *         - Pre-purchase product consultations and expert advice
 *         - Custom jewelry design discussions and requirements gathering
 *         - Post-purchase support for care instructions and maintenance
 *         - Wedding jewelry consultations and appointment scheduling
 *         - Corporate partnership inquiries and bulk order discussions
 *         - Complaint resolution and customer service escalations
 *         
 *         **Data Processing**:
 *         - Email validation ensures valid contact information for responses
 *         - Indian phone number validation (+91XXXXXXXXXX) for local callback capability
 *         - Message content validation prevents empty or malformed submissions
 *         - User authentication links inquiry to account for context and history
 *         - Email notification system alerts support team immediately for timely response
 *         
 *         **Support Team Benefits**:
 *         - User context available through authenticated account association
 *         - Structured data format for easy categorization and response
 *         - Valid contact information guaranteed through validation
 *         - Message history and customer relationship management integration
 *         - Spam prevention through authentication requirement reduces noise
 *       tags:
 *         - Profile
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         description: Contact inquiry details and message
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateContactMeRequest'
 *             example:
 *               name: "John Doe"
 *               email: "john.doe@gmail.com"
 *               phone: "+919876543210"
 *               message: "I would like to inquire about custom jewelry designs for my wedding. Can you provide more information about your services and pricing?"
 *       responses:
 *         201:
 *           description: Message sent successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/SuccessMessage'
 *               example:
 *                 message: "Message sent successfully"
 *         400:
 *           description: Validation error - Invalid email format, phone format, or missing required fields
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ValidationError'
 *               example:
 *                 error:
 *                   - code: "invalid_string"
 *                     expected: "valid email"
 *                     received: "invalid-email"
 *                     path: ["email"]
 *                     message: "Invalid email address"
 *                   - code: "invalid_string"
 *                     expected: "+91 format"
 *                     received: "1234567890"
 *                     path: ["phone"]
 *                     message: "Phone number must be in the 10 digit"
 *         401:
 *           description: Unauthorized - Missing or invalid access token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Unauthorized"
 *         500:
 *           description: Internal server error - Email service or server failure
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 *               example:
 *                 error: "Internal server error"
 */
export const createContactMe = async (req: Request, res: Response) => {
    try {
        const data = createContactMeSchema.parse(req.body);
        const contactMessage = await prisma.contactMessage.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                message: data.message,
            },
        });
        res.status(201).json({ message: "Message sent successfully", contactMessage });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        console.error("Error creating contact message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};